import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateRepositoryDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message:
      'Owner can contain only letters, numbers, underscore, dot, or dash',
  })
  owner!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message:
      'Repository name can contain only letters, numbers, underscore, dot, or dash',
  })
  name!: string;
}
