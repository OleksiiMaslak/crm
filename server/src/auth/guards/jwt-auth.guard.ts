import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser extends { userId: string; email: string }>(
    err: unknown,
    user: TUser | undefined,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return user;
  }
}
