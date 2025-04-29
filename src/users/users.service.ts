import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserResponseDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  private userInclude = {
    role: {
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    },
  };

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');
    
    // Validate role exists
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: { connect: { id: dto.roleId } },
      },
      include: this.userInclude,
    });

    return this.excludePassword(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: this.userInclude,
    });
    return users.map(this.excludePassword);
  }

  async findOne(id: number): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.findUserOrThrow(id);
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
    });

    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return this.excludePassword(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.findUserOrThrow(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) {
        throw new BadRequestException('Role not found');
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.email && { email: dto.email }),
      ...(dto.name && { name: dto.name }),
      ...(dto.password && { password: await bcrypt.hash(dto.password, 10) }),
      ...(dto.roleId !== undefined && { role: { connect: { id: dto.roleId } } }),
    };

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: this.userInclude,
    });

    return this.excludePassword(user);
  }

  async remove(id: number): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.findUserOrThrow(id);

    const deletedUser = await this.prisma.user.delete({
      where: { id },
      include: this.userInclude,
    });

    return this.excludePassword(deletedUser);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponseDto> {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.findUserOrThrow(userId);

    const data: Prisma.UserUpdateInput = {};
    if (dto.name) data.name = dto.name;

    if (dto.newPassword) {
      if (!dto.currentPassword)
        throw new UnauthorizedException('Current password is required');

      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) throw new UnauthorizedException('Incorrect current password');

      data.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: this.userInclude,
    });

    return this.excludePassword(updated);
  }

  private async findUserOrThrow(id: number | string) {
    const numericId = Number(id);

    if (isNaN(numericId) || !Number.isInteger(numericId)) {
      throw new BadRequestException(`Invalid user ID: ${id}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: numericId },
      include: this.userInclude,
    });

    if (!user) throw new NotFoundException(`User with ID ${numericId} not found`);
    return user;
  }

  private excludePassword = (user: any): UserResponseDto => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };
}
