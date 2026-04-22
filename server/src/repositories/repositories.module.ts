import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositorySyncQueueService } from './repository-sync-queue.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { Repository, RepositorySchema } from './schemas/repository.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Repository.name,
        schema: RepositorySchema,
      },
    ]),
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService, RepositorySyncQueueService],
  exports: [MongooseModule, RepositoriesService],
})
export class RepositoriesModule {}
