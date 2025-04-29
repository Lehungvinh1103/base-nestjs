import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MediaUtils } from '../media/media.utils';
import { ModelHasMediaModule } from 'src/model-has-media/model-has-media.module';
import { MediaModule } from 'src/media/media.module';
import { MediaUploadService } from 'src/media/media-upload.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [PrismaModule, AuthModule, MediaModule, ModelHasMediaModule,
    MulterModule.register({
          storage: diskStorage({
            destination: (req, file, cb) => {
              const uploadPath = path.join(process.cwd(), 'uploads');
              if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
              }
              cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
              // Let the service handle the filename for better control
              // This is just temporary for Multer
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              cb(null, uniqueSuffix + path.extname(file.originalname));
            },
          }),
        }),
  ],
  controllers: [PostsController],
  providers: [PostsService, MediaUtils, MediaModule],
  exports: [PostsService],
})
export class PostsModule {} 