import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { addDays, addMinutes } from 'date-fns';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_ATTEMPT_WINDOW = 15; // minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    const existingName = await this.prisma.user.findUnique({
      where: { name },
    });
    if (existingName) {
      throw new ConflictException('Name already exists');
    }
    

    const userRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) {
      throw new ConflictException('Default role "user" not found');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: userRole.id,
        lastLoginAttempt: new Date(),
        loginAttempts: 0,
      },
      include: { role: true },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lastAttempt = user.lastLoginAttempt;
      const minutesSinceLastAttempt = Math.floor(
        (new Date().getTime() - lastAttempt.getTime()) / 60000
      );

      if (minutesSinceLastAttempt < this.LOGIN_ATTEMPT_WINDOW) {
        throw new UnauthorizedException(
          `Account locked. Please try again in ${this.LOGIN_ATTEMPT_WINDOW - minutesSinceLastAttempt} minutes`
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0 },
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          lastLoginAttempt: new Date(),
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAttempt: new Date() },
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const token = await this.prisma.token.findFirst({
        where: {
          token: refreshToken,
          type: 'refresh',
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.token.delete({
        where: { id: token.id },
      });

      return this.generateTokens(token.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.prisma.token.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || 'user',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION_TIME') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME') || '7d',
    });

    const accessTokenExpiresAt = addMinutes(
      new Date(),
      parseInt(this.configService.get('JWT_EXPIRATION_TIME') || '15'),
    );
    const refreshTokenExpiresAt = addDays(
      new Date(),
      parseInt(this.configService.get('JWT_REFRESH_EXPIRATION_TIME') || '7'),
    );

    await this.prisma.token.createMany({
      data: [
        {
          userId: user.id,
          token: accessToken,
          type: 'access',
          expiresAt: accessTokenExpiresAt,
        },
        {
          userId: user.id,
          token: refreshToken,
          type: 'refresh',
          expiresAt: refreshTokenExpiresAt,
        },
      ],
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name || 'user',
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });
  
    if (!user) {
      return {
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      };
    }
  
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
  
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      },
    });
    
    const email = user.email;
    const name = user.name ?? email.split('@')[0];
    const locale = forgotPasswordDto.locale || 'en';
    await this.mailService.sendResetPasswordEmail(email, resetToken, name, locale);
  
    return {
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    };
  }
  
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: resetPasswordDto.email,
        resetToken: { not: null },
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (!user.resetToken) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const isValidToken = await bcrypt.compare(resetPasswordDto.token, user.resetToken);
    if (!isValidToken) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Password has been reset successfully'
    };
  }
}
