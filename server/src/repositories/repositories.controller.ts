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
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.repositoriesService.findAllByUser(req.user.userId);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRepositoryDto) {
    return this.repositoriesService.create(
      req.user.userId,
      dto.owner,
      dto.name,
    );
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.repositoriesService.remove(req.user.userId, id);
  }

  @Patch(':id/refresh')
  refresh(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.repositoriesService.refresh(req.user.userId, id);
  }
}
