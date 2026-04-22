import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RepositorySyncWorkerModule } from './worker/repository-sync-worker.module';

async function bootstrapWorker() {
  await NestFactory.createApplicationContext(RepositorySyncWorkerModule);

  const logger = new Logger('RepositorySyncWorker');
  logger.log('Repository sync worker is running');
}

void bootstrapWorker();
