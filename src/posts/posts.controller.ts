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
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { MediaUploadService } from 'src/media/media-upload.service';

@Controller('posts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaUploadService: MediaUploadService
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Public()
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.postsService.findOneBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Post()
  @RequiredPermission('create:post')
  @UseInterceptors(FilesInterceptor('files', 10, {
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
  create(@Request() req, @UploadedFiles() files: Express.Multer.File[], @Body() dto: CreatePostDto) {
    if (!files || files.length === 0) {
      throw new Error('No files were uploaded');
    }
    return this.postsService.create(req.user.id, files, dto);
  }

  @Patch(':id')
  @RequiredPermission('update:post')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(+id, dto);
  }

  @Delete(':id')
  @RequiredPermission('delete:post')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
