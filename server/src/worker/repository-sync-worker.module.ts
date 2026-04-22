import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoriesModule } from '../repositories/repositories.module';
import { RepositorySyncWorkerService } from '../repositories/repository-sync-worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    RepositoriesModule,
  ],
  providers: [RepositorySyncWorkerService],
})
export class RepositorySyncWorkerModule {}
