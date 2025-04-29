import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto, UpdateMediaDto, LinkMediaDto, QueryMediaDto, GetModelMediaDto } from './dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async findAll(@Query() queryDto: QueryMediaDto) {
    return this.mediaService.findAll(queryDto);
  }

  @Get('model-media')
  async getModelMedia(@Query() queryDto: GetModelMediaDto) {
    return this.mediaService.getModelMedia(queryDto);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMediaDto })
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
  async create(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createMediaDto: CreateMediaDto,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files were uploaded');
    }
    return this.mediaService.create(req.user.id, files, createMediaDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }

  @Post('link-to-model')
  async linkToModel(@Body() linkMediaDto: LinkMediaDto) {
    return this.mediaService.linkToModel(linkMediaDto);
  }
}