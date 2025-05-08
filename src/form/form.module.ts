import { Module } from '@nestjs/common';
import { FormAffiliateController } from './form-affiliate.controller';
import { FormService } from './form.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FormEmailController } from './form-email.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FormAffiliateController, FormEmailController],
  providers: [FormService],
  exports: [FormService],
})
export class FormModule {} 