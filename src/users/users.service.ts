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
import { Media, Prisma } from '@prisma/client';
import { deleteOldMedia, handleMediaUpload } from 'src/media/media.handler';
import { MediaUtils } from 'src/common/utils/media.util';

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

  async create(dto: CreateUserDto, files: Express.Multer.File[]): Promise<UserResponseDto> {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Email already in use');

      const role = await tx.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException('Role not found');

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: { connect: { id: dto.roleId } },
        },
        include: this.userInclude,
      });

      let uploadedMedia: Media[] = [];

      if (files && files.length > 0) {
        uploadedMedia = await handleMediaUpload({
          tx,
          files,
          modelType: 'User',
          modelId: user.id,
          fieldType: 'avatar',
          userId: user.id,
          collection: 'Avatar',
        });
      }

      const avatar = uploadedMedia[0] ? this.getMediaUrl(uploadedMedia[0]) : null;

      return {
        ...this.excludePassword(user),
        avatar,
      };
    });
  }


  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: this.userInclude,
    });

    const userIds = users.map(user => user.id);
    const mediaMap = await MediaUtils.getMediaForModels('User', userIds);

    return users.map(user => ({
      ...this.excludePassword(user),
      avatar: mediaMap[user.id] || {},
    }));
  }


  async findOne(id: number): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.findUserOrThrow(id);
    const mediaMap = await MediaUtils.getMediaForModel('User', user.id);
    const avatar = mediaMap['avatar']?.url ?? null;

    return {
      ...this.excludePassword(user),
      avatar,
    };
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

    const mediaMap = await MediaUtils.getMediaForModel('User', user.id);
    const avatar = mediaMap['avatar']?.url ?? null;

    return {
      ...this.excludePassword(user),
      avatar,
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    files: Express.Multer.File[],
  ): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.findUserOrThrow(id);

      if (dto.email) {
        const existing = await tx.user.findFirst({
          where: { email: dto.email, id: { not: id } },
        });
        if (existing) {
          throw new BadRequestException('Email already in use');
        }
      }

      if (dto.roleId) {
        const role = await tx.role.findUnique({ where: { id: dto.roleId } });
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

      const updatedUser = await tx.user.update({
        where: { id },
        data,
        include: this.userInclude,
      });

      let uploadedMedia: Media[] = [];

      if (files && files.length > 0) {
        // Có file mới => upload
        uploadedMedia = await handleMediaUpload({
          tx,
          files,
          modelType: 'User',
          modelId: updatedUser.id,
          fieldType: 'avatar',
          userId: updatedUser.id,
          collection: 'Avatar',
        });
      } else {
        // Không có file => lấy media hiện tại
        const existingMedia = await tx.modelHasMedia.findFirst({
          where: {
            modelType: 'User',
            modelId: updatedUser.id,
          },
          include: { media: true },
        });

        if (existingMedia?.media) {
          uploadedMedia = [existingMedia.media];
        }
      }

      const avatar = uploadedMedia[0] ? this.getMediaUrl(uploadedMedia[0]) : null;

      return {
        ...this.excludePassword(updatedUser),
        avatar,
      };
    });
  }


  async remove(id: number): Promise<UserResponseDto> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }
  
    await this.findUserOrThrow(id);
  
    return await this.prisma.$transaction(async (tx) => {

      await deleteOldMedia('User', id, tx);
      

      const deletedUser = await this.prisma.user.delete({
        where: { id },
        include: this.userInclude,
      });
  

      return this.excludePassword(deletedUser);
    });
  }
  

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    files: Express.Multer.File[] = []  // Thêm đối số files
  ): Promise<UserResponseDto> {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
  
    return this.prisma.$transaction(async (tx) => {
      const user = await this.findUserOrThrow(userId);
  
      const data: Prisma.UserUpdateInput = {};
  
      if (dto.name) {
        data.name = dto.name;
      }
  
      if (dto.newPassword) {
        if (!dto.currentPassword)
          throw new UnauthorizedException('Current password is required');
  
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) throw new UnauthorizedException('Incorrect current password');
  
        data.password = await bcrypt.hash(dto.newPassword, 10);
      }
  
      // Cập nhật thông tin người dùng
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data,
        include: this.userInclude,
      });
  
      let uploadedMedia: Media[] = [];
  
      if (files && files.length > 0) {
        // Có file mới => upload
        uploadedMedia = await handleMediaUpload({
          tx,
          files,
          modelType: 'User',
          modelId: updatedUser.id,
          fieldType: 'avatar',
          userId: updatedUser.id,
          collection: 'Avatar',
        });
      } else {
        // Không có file => lấy media hiện tại
        const existingMedia = await tx.modelHasMedia.findFirst({
          where: {
            modelType: 'User',
            modelId: updatedUser.id,
          },
          include: { media: true },
        });
  
        if (existingMedia?.media) {
          uploadedMedia = [existingMedia.media];
        }
      }
  
      const avatar = uploadedMedia[0] ? this.getMediaUrl(uploadedMedia[0]) : null;
  
      return {
        ...this.excludePassword(updatedUser),
        avatar,
      };
    });
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
    const mediaMap = await MediaUtils.getMediaForModel('User', user.id);
    const avatar = mediaMap['avatar']?.url ?? null;

    return {
      ...user,
      avatar,
    };
  }

  private excludePassword = (user: any): UserResponseDto => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

  private getMediaUrl(media: Media) {
    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${media.fileName}`;
  }

}
