import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/affiliate.dto';
import { CreateAffiliateClickDto } from './dto/affiliate-click.dto';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    return user?.role?.name === 'admin';
  }

  async create(currentUserId: number, dto: CreateAffiliateDto, isAdmin: boolean) {
    // Validate code uniqueness
    const existingCode = await this.prisma.affiliate.findFirst({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new BadRequestException('Affiliate code already exists');
    }

    // Validate user exists if userId is provided
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }
    }

    const userId = isAdmin && dto.userId ? dto.userId : currentUserId;

    return this.prisma.affiliate.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    const isUserAdmin = await this.isAdmin(userId);

    return this.prisma.affiliate.findMany({
      ...(isUserAdmin ? {} : { where: { userId } }),
    });
  }

  async findOne(userId: number, id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    const isUserAdmin = await this.isAdmin(userId);

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isUserAdmin ? {} : { userId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    return affiliate;
  }

  async update(currentUserId: number, id: number, dto: UpdateAffiliateDto, isAdmin: boolean) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    // Validate code uniqueness if code is being updated
    if (dto.code) {
      const existingCode = await this.prisma.affiliate.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new BadRequestException('Affiliate code already exists');
      }
    }

    // Validate user exists if userId is being updated
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }
    }

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { userId: currentUserId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(currentUserId: number, id: number, isAdmin: boolean) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { userId: currentUserId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliate.delete({
      where: { id },
    });
  }

  async handleClick(dto: CreateAffiliateClickDto, ipAddress: string, userAgent: string) {
    return await this.prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate.findUnique({
        where: { code: dto.code },
      });

      if (!affiliate) {
        throw new NotFoundException('Invalid affiliate code');
      }

      const token = await tx.affiliateClick.findFirst({
        where: { token: dto.token },
      });

      if (token) {
        throw new BadRequestException('Token already used');
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentClicks = await tx.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          ipAddress: ipAddress,
          userAgent: userAgent,

          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (recentClicks > 30) {
        throw new BadRequestException('Suspicious click activity detected');
      }

      // Create click record
      const click = await tx.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          ipAddress: ipAddress,
          userAgent: userAgent,
          token: dto.token
        },
      });

      await tx.affiliate.update({
        where: { id: affiliate.id },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

      return click;
    });
  }

  async getClicks(userId: number, affiliateId: number) {
    const isUserAdmin = await this.isAdmin(userId);

    // Verify affiliate belongs to user or user is admin
    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        ...(isUserAdmin ? {} : { userId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliateClick.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
