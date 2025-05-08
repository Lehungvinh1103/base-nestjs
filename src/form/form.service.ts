import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormEmailDto, UpdateFormEmailDto } from './dto/form-email.dto';
import { CreateFormAffDto, UpdateFormAffDto } from './dto/form-affiliate.dto';


@Injectable()
export class FormService {
  constructor(private prisma: PrismaService) { }

  async createFormEmail(dto: CreateFormEmailDto) {
    const existingEmail = await this.prisma.formEmail.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    return this.prisma.formEmail.create({ data: dto });
  }

  async updateFormEmail(id: number, dto: UpdateFormEmailDto) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingEmail = await this.prisma.formEmail.findUnique({
      where: { id },
    });

    if (!existingEmail) {
      throw new NotFoundException('Email not found');
    }

    if(dto.email && dto.email !== existingEmail.email) {
      const emailExists = await this.prisma.formEmail.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    return this.prisma.formEmail.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFormEmail(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingEmail = await this.prisma.formEmail.findUnique({
      where: { id },
    });

    if (!existingEmail) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.formEmail.delete({
      where: { id },
    });
  }

  async getFormEmail(id: number) {  
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingEmail = await this.prisma.formEmail.findUnique({
      where: { id },
    });

    if (!existingEmail) {
      throw new NotFoundException('Email not found');
    }

    return existingEmail;
  }

  async getAllFormEmail() {
    return this.prisma.formEmail.findMany();
  }

  async createFormAffiliate(dto: CreateFormAffDto) {

    return this.prisma.formAffiliate.create({ data: dto });
  }

  async updateFormAffiliate(id: number, dto: UpdateFormAffDto) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingAffiliate = await this.prisma.formAffiliate.findUnique({
      where: { id },
    });

    if (!existingAffiliate) {
      throw new NotFoundException('Form Affiliate not found');
    }

    return this.prisma.formAffiliate.update({
      where: { id },
      data: dto,
    });
  }
  async deleteFormAffiliate(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingAffiliate = await this.prisma.formAffiliate.findUnique({
      where: { id },
    });

    if (!existingAffiliate) {
      throw new NotFoundException('Form Affiliate not found');
    }

    return this.prisma.formAffiliate.delete({
      where: { id },
    });
  }
  async getFormAffiliate(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const existingAffiliate = await this.prisma.formAffiliate.findUnique({
      where: { id },
    });

    if (!existingAffiliate) {
      throw new NotFoundException('Form Affiliate not found');
    }

    return existingAffiliate;
  }

  async getAllFormAffiliate() {
    return this.prisma.formAffiliate.findMany();
  }
}
