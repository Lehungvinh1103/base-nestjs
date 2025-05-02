import { Module, forwardRef } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module'; // Đảm bảo rằng UsersModule được import đúng
import { MediaUploadService } from './media-upload.service';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    UploadModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaUploadService],
  exports: [MediaService, MediaUploadService],
})
export class MediaModule {}
