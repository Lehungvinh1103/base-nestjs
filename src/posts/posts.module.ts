import { Module, forwardRef } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MediaUtils } from '../media/media.utils';
import { ModelHasMediaModule } from 'src/model-has-media/model-has-media.module';
import { MediaModule } from 'src/media/media.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    forwardRef(() => MediaModule),
    ModelHasMediaModule,
    UploadModule
  ],
  controllers: [PostsController],
  providers: [PostsService, MediaUtils],
  exports: [PostsService],
})
export class PostsModule { }
