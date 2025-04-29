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
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/affiliate.dto';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';

@Controller('affiliates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  private getIsAdmin(req): boolean {
    return req.user?.role?.name === 'admin';
  }

  @Post()
  @RequiredPermission('create:affiliate')
  create(@Request() req, @Body() dto: CreateAffiliateDto) {
    return this.affiliateService.create(req.user.id, dto, this.getIsAdmin(req));
  }

  @Get()
  @RequiredPermission('view:affiliate')
  findAll(@Request() req) {
    return this.affiliateService.findAll(req.user.id);
  }

  @Get(':id')
  @RequiredPermission('view:affiliate')
  findOne(@Request() req, @Param('id') id: string) {
    return this.affiliateService.findOne(req.user.id, +id);
  }

  @Patch(':id')
  @RequiredPermission('update:affiliate')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateAffiliateDto,
  ) {
    return this.affiliateService.update(req.user.id, +id, dto, this.getIsAdmin(req));
  }

  @Delete(':id')
  @RequiredPermission('delete:affiliate')
  remove(@Request() req, @Param('id') id: string) {
    return this.affiliateService.remove(req.user.id, +id, this.getIsAdmin(req));
  }
}
