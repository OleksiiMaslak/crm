import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { Repository, RepositorySchema } from './schemas/repository.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Repository.name,
        schema: RepositorySchema,
      },
    ]),
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [MongooseModule, RepositoriesService],
})
export class RepositoriesModule {}
