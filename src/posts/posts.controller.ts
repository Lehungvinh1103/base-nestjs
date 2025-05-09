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
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostResponseDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MediaUploadService } from 'src/media/media-upload.service';
import { plainToInstance } from 'class-transformer';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaUploadService: MediaUploadService
  ) { }

  @Public()
  @Get()
  async findAll() {
    const posts = await this.postsService.findAll();
    return plainToInstance(PostResponseDto, posts);
  }

  @Public()
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.postsService.findOneBySlug(slug);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const post = await this.postsService.findOne(+id);
    return plainToInstance(PostResponseDto, post);
  }

  @Post()
  @RequiredPermission('create:post')
  @UseInterceptors(FilesInterceptor('image', 10, {
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
  @ApiBody({ type: CreatePostDto })
  create(@Request() req, @UploadedFiles() image: Express.Multer.File[], @Body() dto: CreatePostDto) {
    if (!image || image.length === 0) {
      throw new BadRequestException('No image file provided');
    }
    return this.postsService.create(req.user.id, image, dto);
  }

  @Patch(':id')
  @RequiredPermission('update:post')
  @UseInterceptors(FilesInterceptor('image', 10, {
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
  @ApiBody({ type: UpdatePostDto })
  update(
    @Param('id') id: string,
    @UploadedFiles() image: Express.Multer.File[],
    @Body() dto: UpdatePostDto,
    @Request() req
  ) {
    return this.postsService.update(+id, dto, image, req.user.id);
  }

  @Delete(':id')
  @RequiredPermission('delete:post')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
