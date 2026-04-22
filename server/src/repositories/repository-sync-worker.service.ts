import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { RepositoriesService } from './repositories.service';
import {
  REPOSITORY_SYNC_JOB_NAME,
  REPOSITORY_SYNC_QUEUE_NAME,
  RepositorySyncJobData,
} from './repository-sync-queue.constants';

@Injectable()
export class RepositorySyncWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RepositorySyncWorkerService.name);
  private readonly connection: IORedis;
  private worker: Worker<RepositorySyncJobData> | null = null;

  constructor(
    private readonly repositoriesService: RepositoriesService,
    configService: ConfigService,
  ) {
    const redisUrl =
      configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  onModuleInit() {
    this.worker = new Worker<RepositorySyncJobData>(
      REPOSITORY_SYNC_QUEUE_NAME,
      async (job: Job<RepositorySyncJobData>) => {
        if (job.name !== REPOSITORY_SYNC_JOB_NAME) {
          return;
        }

        await this.repositoriesService.processRepositorySync(
          job.data.repositoryId,
        );
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Repository sync job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Repository sync job failed: ${job?.id ?? 'unknown'} (${error.message})`,
      );
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }

    await this.connection.quit();
  }
}
