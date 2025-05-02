import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { MediaModule } from 'src/media/media.module';
import { MediaUtils } from 'src/media/media.utils';
import { ModelHasMediaModule } from 'src/model-has-media/model-has-media.module'; // Import ModelHasMediaModule

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    forwardRef(() => MediaModule),
    ModelHasMediaModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, MediaUtils],
  exports: [UsersService],
})
export class UsersModule { }
