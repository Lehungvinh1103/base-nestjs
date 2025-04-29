import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/affiliate.dto';

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
}
