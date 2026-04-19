import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Repository, RepositoryDocument } from './schemas/repository.schema';

type GithubRepositoryResponse = {
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
};

type RepositoryLean = Repository & {
  userId: string;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAtUtcUnix: number;
  _id: {
    toString: () => string;
  };
};

@Injectable()
export class RepositoriesService {
  private readonly repositoryPathPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  private readonly githubRateWindowMs = 60_000;
  private readonly githubRateMaxRequests = 300;
  private readonly githubRequestTimestamps: number[] = [];

  constructor(
    @InjectModel(Repository.name)
    private readonly repositoryModel: Model<RepositoryDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, owner: string, name: string) {
    const normalizedOwner = owner.trim();
    const normalizedName = name.trim();

    // Normalize before validation and duplicate checks so ` Facebook / react ` does not create duplicates.
    this.ensureRepositoryPath(normalizedOwner, normalizedName);

    const existing = await this.repositoryModel
      .findOne({
        userId,
        owner: normalizedOwner,
        name: normalizedName,
      })
      .lean();

    if (existing) {
      throw new ConflictException('Repository already added');
    }

    const githubData = await this.fetchRepository(
      normalizedOwner,
      normalizedName,
    );

    const created = await this.repositoryModel.create({
      userId,
      owner: normalizedOwner,
      name: normalizedName,
      url: githubData.html_url,
      description: githubData.description ?? '',
      language: githubData.language ?? '',
      stars: githubData.stargazers_count,
      forks: githubData.forks_count,
      openIssues: githubData.open_issues_count,
      createdAtUtcUnix: Math.floor(
        new Date(githubData.created_at).getTime() / 1000,
      ),
    });

    const createdRepository = await this.repositoryModel
      .findById(created._id)
      .lean<RepositoryLean>();

    if (!createdRepository) {
      throw new NotFoundException('Repository not found after creation');
    }

    return this.toResponse(createdRepository);
  }

  async findAllByUser(userId: string) {
    const repositories = await this.repositoryModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .lean<RepositoryLean[]>();

    return repositories.map((repo) => this.toResponse(repo));
  }

  async remove(userId: string, repositoryId: string) {
    this.ensureValidObjectId(repositoryId);

    const deleted = await this.repositoryModel.findOneAndDelete({
      _id: repositoryId,
      userId,
    });

    if (!deleted) {
      throw new NotFoundException('Repository not found');
    }

    return {
      success: true,
    };
  }

  async refresh(userId: string, repositoryId: string) {
    this.ensureValidObjectId(repositoryId);

    const repository = await this.repositoryModel.findOne({
      _id: repositoryId,
      userId,
    });

    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    const githubData = await this.fetchRepository(
      repository.owner,
      repository.name,
    );

    repository.url = githubData.html_url;
    repository.description = githubData.description ?? '';
    repository.language = githubData.language ?? '';
    repository.stars = githubData.stargazers_count;
    repository.forks = githubData.forks_count;
    repository.openIssues = githubData.open_issues_count;
    repository.createdAtUtcUnix = Math.floor(
      new Date(githubData.created_at).getTime() / 1000,
    );

    await repository.save();

    const refreshedRepository = await this.repositoryModel
      .findById(repository._id)
      .lean<RepositoryLean>();

    if (!refreshedRepository) {
      throw new NotFoundException('Repository not found after refresh');
    }

    return this.toResponse(refreshedRepository);
  }

  private ensureRepositoryPath(owner: string, name: string) {
    const repositoryPath = `${owner}/${name}`;

    if (!this.repositoryPathPattern.test(repositoryPath)) {
      throw new BadRequestException(
        'Repository path must be in owner/name format',
      );
    }
  }

  private ensureValidObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid repository id');
    }
  }

  private enforceLocalGithubRateLimit() {
    const now = Date.now();
    const minTimestamp = now - this.githubRateWindowMs;

    // Sliding window in memory: enough for a single-node app and avoids hammering GitHub accidentally.
    while (
      this.githubRequestTimestamps.length > 0 &&
      this.githubRequestTimestamps[0] < minTimestamp
    ) {
      this.githubRequestTimestamps.shift();
    }

    if (this.githubRequestTimestamps.length >= this.githubRateMaxRequests) {
      throw new HttpException(
        'Too many GitHub requests. Please try again in about a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.githubRequestTimestamps.push(now);
  }

  private async fetchRepository(
    owner: string,
    name: string,
  ): Promise<GithubRepositoryResponse> {
    this.enforceLocalGithubRateLimit();

    const token = this.configService.get<string>('GITHUB_TOKEN');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'crm-app',
    };

    // Token is optional: anonymous requests still work, just with stricter GitHub rate limits.
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (response.status === 404) {
      throw new NotFoundException(
        `Repository "${owner}/${name}" was not found on GitHub`,
      );
    }

    if (response.status === 401) {
      throw new UnauthorizedException(
        'GitHub access token is invalid or does not have enough permissions',
      );
    }

    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');

      // Distinguish hard rate-limit exhaustion from other temporary 403 responses.
      if (remaining === '0') {
        throw new HttpException(
          'GitHub API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'GitHub API temporarily rejected the request. Please retry shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch repository from GitHub (status ${response.status})`,
      );
    }

    return (await response.json()) as GithubRepositoryResponse;
  }

  private toResponse(repo: RepositoryLean) {
    return {
      id: repo._id.toString(),
      userId: repo.userId,
      owner: repo.owner,
      name: repo.name,
      url: repo.url,
      description: repo.description ?? '',
      language: repo.language ?? '',
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues,
      createdAtUtcUnix: repo.createdAtUtcUnix,
    };
  }
}
