import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserResponseDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseInterceptors(FilesInterceptor('avatar', 1, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
        return cb(new Error('Only JPEG, PNG, and JPG files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  @RequiredPermission('create:user')
  async create(@Body() dto: CreateUserDto, @UploadedFiles() avatar: Express.Multer.File[]) {
    const user = await this.usersService.create(dto, avatar);
    return plainToInstance(UserResponseDto, user);
  }

  @Get()
  @RequiredPermission('view:user')
  async findAll(@Request() req) {
    const user = await this.usersService.findAll(req.user.id);
    return plainToInstance(UserResponseDto, user);
  }

  @Get(':id')
  @RequiredPermission('view:user')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return plainToInstance(UserResponseDto, user);
  }

  @Get('by-name/:name')
  @Public()
  async findByName(@Param('name') name: string) {
    const user = await this.usersService.findByName(name);
    return plainToInstance(UserResponseDto, user);
  }


  @Patch(':id')
  @RequiredPermission('update:user')
  @UseInterceptors(FilesInterceptor('avatar', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
        return cb(new Error('Only JPEG, PNG, and JPG files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @UploadedFiles() avatar: Express.Multer.File[]) {
    const user = await this.usersService.update(+id, dto, avatar);
    return plainToInstance(UserResponseDto, user);
  }

  @Delete(':id')
  @RequiredPermission('delete:user')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('profile/me')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile/me')
  @UseInterceptors(FilesInterceptor('avatar', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
        return cb(new Error('Only JPEG, PNG, and JPG files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto, @UploadedFiles() avatar: Express.Multer.File[]) {
    return this.usersService.updateProfile(req.user.id, dto, avatar);
  }
}
