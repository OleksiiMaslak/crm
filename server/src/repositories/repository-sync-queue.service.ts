import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import {
  REPOSITORY_SYNC_JOB_NAME,
  REPOSITORY_SYNC_QUEUE_NAME,
  RepositorySyncJobData,
} from './repository-sync-queue.constants';

@Injectable()
export class RepositorySyncQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(RepositorySyncQueueService.name);
  private readonly connection: IORedis;
  private readonly queue: Queue<RepositorySyncJobData>;

  constructor(configService: ConfigService) {
    const redisUrl =
      configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue<RepositorySyncJobData>(REPOSITORY_SYNC_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2_000,
        },
        removeOnComplete: 100,
        removeOnFail: 300,
      },
    });
  }

  async enqueue(repositoryId: string) {
    try {
      await this.queue.add(REPOSITORY_SYNC_JOB_NAME, { repositoryId });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue repository sync job for ${repositoryId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Background sync queue is currently unavailable',
      );
    }
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
