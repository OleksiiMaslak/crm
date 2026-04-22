import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { RepositorySyncQueueService } from './repository-sync-queue.service';
import { RepositoriesService } from './repositories.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('repositories')
@UseGuards(JwtAuthGuard)
export class RepositoriesController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly repositorySyncQueueService: RepositorySyncQueueService,
  ) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.repositoriesService.findAllByUser(req.user.userId);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRepositoryDto,
  ) {
    const repository = await this.repositoriesService.create(
      req.user.userId,
      dto.owner,
      dto.name,
    );

    await this.repositorySyncQueueService.enqueue(repository.id);

    return repository;
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.repositoriesService.remove(req.user.userId, id);
  }

  @Patch(':id/refresh')
  async refresh(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const repository = await this.repositoriesService.refresh(
      req.user.userId,
      id,
    );

    await this.repositorySyncQueueService.enqueue(repository.id);

    return repository;
  }
}
