import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setRefreshCookie(res, session.refreshToken);
    return this.authService.toAuthResponse(session);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(res, session.refreshToken);
    return this.authService.toAuthResponse(session);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const session = await this.authService.refresh(refreshToken);
    // Every refresh rotates the cookie as well, so old refresh tokens expire naturally.
    this.setRefreshCookie(res, session.refreshToken);

    return this.authService.toAuthResponse(session);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });

    return { success: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // Limit the cookie to auth endpoints so it is not sent on unrelated requests.
      path: '/api/auth',
      maxAge: this.authService.getRefreshTokenMaxAgeMs(),
    });
  }
}
