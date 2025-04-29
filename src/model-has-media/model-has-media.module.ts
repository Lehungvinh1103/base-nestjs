import { Module } from '@nestjs/common';
import { ModelHasMediaService } from './model-has-media.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ModelHasMediaService],
  exports: [ModelHasMediaService],
})
export class ModelHasMediaModule {}