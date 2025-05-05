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
  Headers,
  Ip,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/affiliate.dto';
import { CreateAffiliateClickDto } from './dto/affiliate-click.dto';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

ApiTags('Affiliate')
@Controller('affiliates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) { }

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

  @Post('click')
  @ApiOperation({ summary: 'Cập nhật lượt click cho aff' })
  @Public()
  async handleClick(
    @Body() dto: CreateAffiliateClickDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ) {
    if (!userAgent) {
      throw new BadRequestException('User agent is required');
    }
    return this.affiliateService.handleClick(dto, ipAddress, userAgent);
  }

  @Get(':id/clicks')
  getClicks(@Request() req, @Param('id') id: string) {
    return this.affiliateService.getClicks(req.user.id, +id);
  }

  @ApiOperation({ summary: 'Lấy thống kê tổng quan cho dashboard' })
  @Get('dashboard/stats')
  getDashboardStats(@Request() req, @Query() filters: StatsFilterDto) {
    return this.affiliateService.getDashboardStats(req.user.id, filters);
  }

  @ApiOperation({ summary: 'Lấy bảng xếp hạng người dùng theo lượt click' })
  @Get('stats/top')
  getTopAffiliates(@Request() req, @Query() filters: StatsFilterDto) {
    return this.affiliateService.getTopAffiliates(req.user.id, filters);
  }

  @ApiOperation({ summary: 'Lấy thống kê theo thời gian (tháng, quý)' })
  @Get('stats/time-stats')
  getTimeStats(@Request() req, @Query('affiliateId') affiliateId?: string) {
    return this.affiliateService.getAffiliateStatsByTime(
      req.user.id,
      affiliateId ? +affiliateId : undefined
    );
  }

  @ApiOperation({ summary: 'Thống kê dữ liệu người dùng theo lượt click' })
  @Get('stats/user-stats')
  getUserStats(@Request() req, @Query() filters: StatsFilterDto) {
    return this.affiliateService.getUserStatsOverTime(req.user.id, filters);
  }

}
