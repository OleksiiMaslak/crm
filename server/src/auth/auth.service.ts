import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
  };
};

type AuthSession = AuthResponse & {
  refreshToken: string;
};

type RefreshPayload = {
  sub: string;
  email: string;
  type: 'refresh';
};

type AccessPayload = {
  sub: string;
  email: string;
  type?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const accessToken = await this.signAccessToken(user.id, user.email);
    const refreshToken = await this.signRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.signAccessToken(user.id, user.email);
    const refreshToken = await this.signRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = await this.verifyRefreshOrAccessPayload(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = await this.signAccessToken(user.id, user.email);
    const newRefreshToken = await this.signRefreshToken(user.id, user.email);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      user,
    };
  }

  private async verifyRefreshPayload(
    refreshToken: string,
  ): Promise<RefreshPayload> {
    const secrets = this.getRefreshSecretsForVerification();

    for (const secret of secrets) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshPayload>(
          refreshToken,
          { secret },
        );

        if (payload.type !== 'refresh') {
          throw new UnauthorizedException('Invalid refresh token');
        }

        return payload;
      } catch {
        continue;
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  private async verifyRefreshOrAccessPayload(
    token: string,
  ): Promise<{ sub: string; email: string }> {
    try {
      const refreshPayload = await this.verifyRefreshPayload(token);
      return { sub: refreshPayload.sub, email: refreshPayload.email };
    } catch {
      // Fallback for clients that only have access token at page reload time.
      try {
        const accessPayload = await this.jwtService.verifyAsync<AccessPayload>(
          token,
          {
            secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          },
        );

        if (!accessPayload?.sub || !accessPayload?.email) {
          throw new UnauthorizedException('Invalid access token');
        }

        return { sub: accessPayload.sub, email: accessPayload.email };
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }
  }

  toAuthResponse(session: AuthSession): AuthResponse {
    return {
      accessToken: session.accessToken,
      tokenType: session.tokenType,
      user: session.user,
    };
  }

  getRefreshTokenMaxAgeMs(): number {
    return this.getJwtDurationMs(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      7 * 24 * 60 * 60 * 1000,
    );
  }

  private async signAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const expiresInSeconds = this.getJwtExpiresInSeconds();

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      { expiresIn: expiresInSeconds },
    );
  }

  private async signRefreshToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const expiresInSeconds = Math.floor(this.getRefreshTokenMaxAgeMs() / 1000);

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        type: 'refresh',
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: expiresInSeconds,
      },
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }

  private getRefreshSecretsForVerification(): string[] {
    const refreshSecret = this.getRefreshSecret();
    const accessSecret = this.configService.getOrThrow<string>('JWT_SECRET');

    return Array.from(new Set([refreshSecret, accessSecret]));
  }

  private getJwtExpiresInSeconds(): number {
    const rawValue = this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return Math.floor(this.getJwtDurationMs(rawValue, 15 * 60 * 1000) / 1000);
  }

  private getJwtDurationMs(rawValue: string, fallbackMs: number): number {
    const match = rawValue.trim().match(/^(\d+)([smhd])?$/i);

    if (!match) {
      return fallbackMs;
    }

    const amount = Number(match[1]);
    const unit = (match[2] ?? 's').toLowerCase();

    if (unit === 'm') {
      return amount * 60 * 1000;
    }

    if (unit === 'h') {
      return amount * 60 * 60 * 1000;
    }

    if (unit === 'd') {
      return amount * 24 * 60 * 60 * 1000;
    }

    return amount * 1000;
  }
}
