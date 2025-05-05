import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/affiliate.dto';
import { CreateAffiliateClickDto } from './dto/affiliate-click.dto';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { MonthlyStats, QuarterlyStats, TimeStats } from './dto/stats.dto';


@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) { }

  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    return user?.role?.name === 'admin';
  }

  async create(currentUserId: number, dto: CreateAffiliateDto, isAdmin: boolean) {
    // Validate code uniqueness
    const existingCode = await this.prisma.affiliate.findFirst({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new BadRequestException('Affiliate code already exists');
    }

    // Validate user exists if userId is provided
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }
    }

    const userId = isAdmin && dto.userId ? dto.userId : currentUserId;

    return this.prisma.affiliate.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    const isUserAdmin = await this.isAdmin(userId);

    return this.prisma.affiliate.findMany({
      ...(isUserAdmin ? {} : { where: { userId } }),
    });
  }

  async findOne(userId: number, id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    const isUserAdmin = await this.isAdmin(userId);

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isUserAdmin ? {} : { userId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    return affiliate;
  }

  async update(currentUserId: number, id: number, dto: UpdateAffiliateDto, isAdmin: boolean) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    // Validate code uniqueness if code is being updated
    if (dto.code) {
      const existingCode = await this.prisma.affiliate.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new BadRequestException('Affiliate code already exists');
      }
    }

    // Validate user exists if userId is being updated
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }
    }

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { userId: currentUserId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(currentUserId: number, id: number, isAdmin: boolean) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid affiliate ID');
    }

    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { userId: currentUserId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliate.delete({
      where: { id },
    });
  }

  async handleClick(dto: CreateAffiliateClickDto, ipAddress: string, userAgent: string) {
    return await this.prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate.findUnique({
        where: { code: dto.code },
      });

      if (!affiliate) {
        throw new NotFoundException('Invalid affiliate code');
      }

      const token = await tx.affiliateClick.findFirst({
        where: { token: dto.token },
      });

      if (token) {
        throw new BadRequestException('Token already used');
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentClicks = await tx.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          ipAddress: ipAddress,
          userAgent: userAgent,

          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (recentClicks > 30) {
        throw new BadRequestException('Suspicious click activity detected');
      }

      // Create click record
      const click = await tx.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          ipAddress: ipAddress,
          userAgent: userAgent,
          token: dto.token
        },
      });

      await tx.affiliate.update({
        where: { id: affiliate.id },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

      return click;
    });
  }

  async getClicks(userId: number, affiliateId: number) {
    const isUserAdmin = await this.isAdmin(userId);

    // Verify affiliate belongs to user or user is admin
    const affiliate = await this.prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        ...(isUserAdmin ? {} : { userId }),
      },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found or access denied');
    }

    return this.prisma.affiliateClick.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardStats(userId: number, filters: StatsFilterDto) {
    const isUserAdmin = await this.isAdmin(userId);

    // Xây dựng điều kiện lọc theo thời gian
    const dateFilter = this.buildDateFilter(filters);

    // Tổng người dùng
    const totalUsers = await this.prisma.user.count();

    // Nếu là admin thì xem tất cả, ngược lại chỉ xem của mình
    const affiliateWhere = isUserAdmin ? { ...dateFilter } : { userId, ...dateFilter };

    // Tổng affiliate
    const totalAffiliates = await this.prisma.affiliate.count({
      where: affiliateWhere
    });

    // Tổng hoa hồng và lượt click
    const aggregations = await this.prisma.affiliate.aggregate({
      where: affiliateWhere,
      _sum: {
        commission: true,
        clicks: true,
      }
    });

    return {
      totalUsers: isUserAdmin ? totalUsers : 1,
      totalAffiliates,
      totalCommission: aggregations._sum.commission || 0,
      totalClicks: aggregations._sum.clicks || 0
    };
  }

  async getTopAffiliates(userId: number, filters: StatsFilterDto) {
    const isUserAdmin = await this.isAdmin(userId);

    // Xây dựng điều kiện lọc theo thời gian cho bảng AffiliateClick
    const dateFilter = this.buildDateFilter(filters);
    const clicksDateFilter = dateFilter.createdAt ? { clickedAt: dateFilter.createdAt } : {};

    // Nếu là admin thì xem tất cả, ngược lại chỉ xem của mình
    const where = isUserAdmin ? {} : { userId };

    const affiliates = await this.prisma.affiliate.findMany({
      where,
      select: {
        id: true,
        code: true,
        userId: true,
        commission: true,
        clicks: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            affiliateClick: {
              where: clicksDateFilter
            }
          }
        }
      },
      orderBy: [
        { clicks: 'desc' },
        { commission: 'desc' }
      ],
      take: filters.limit || 10
    });

    return affiliates.map(affiliate => ({
      id: affiliate.id,
      code: affiliate.code,
      user: affiliate.user,
      commission: affiliate.commission,
      totalClicks: affiliate.clicks,
      periodClicks: affiliate._count.affiliateClick
    }));
  }

  // Phương thức hỗ trợ tạo điều kiện lọc theo thời gian
  private buildDateFilter(filters: StatsFilterDto) {
    const dateFilter: any = {};

    if (filters.year) {
      let startDate: Date;
      let endDate: Date;

      if (filters.periodType === 'month' && filters.month) {
        // Lọc theo tháng
        startDate = new Date(filters.year, filters.month - 1, 1);
        endDate = new Date(filters.year, filters.month, 0); // Ngày cuối của tháng
      } else if (filters.periodType === 'quarter' && filters.quarter) {
        // Lọc theo quý
        const startMonth = (filters.quarter - 1) * 3;
        startDate = new Date(filters.year, startMonth, 1);
        endDate = new Date(filters.year, startMonth + 3, 0); // Ngày cuối của quý
      } else {
        // Lọc theo năm
        startDate = new Date(filters.year, 0, 1);
        endDate = new Date(filters.year, 11, 31);
      }

      // Set time đến cuối ngày cho endDate
      endDate.setHours(23, 59, 59, 999);

      dateFilter.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    return dateFilter;
  }


  // Thêm phương thức để lấy dữ liệu chi tiết theo thời gian
  async getAffiliateStatsByTime(userId: number, affiliateId?: number) {
    const isUserAdmin = await this.isAdmin(userId);

    // Nếu là admin thì xem tất cả, ngược lại chỉ xem của mình
    let where: any = {};

    if (!isUserAdmin) {
      where.userId = userId;
    }

    if (affiliateId) {
      where.id = affiliateId;
    }

    // Lấy dữ liệu theo tháng trong năm hiện tại
    const currentYear = new Date().getFullYear();
    const monthlyStats: MonthlyStats[] = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      const clicksCount = await this.prisma.affiliateClick.count({
        where: {
          affiliate: { ...where },
          clickedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      monthlyStats.push({
        month: month + 1,
        clicks: clicksCount
      });
    }

    // Lấy dữ liệu theo quý
    const quarterlyStats: QuarterlyStats[] = [];
    for (let quarter = 0; quarter < 4; quarter++) {
      const startMonth = quarter * 3;
      const startDate = new Date(currentYear, startMonth, 1);
      const endDate = new Date(currentYear, startMonth + 3, 0);
      endDate.setHours(23, 59, 59, 999);

      const clicksCount = await this.prisma.affiliateClick.count({
        where: {
          affiliate: { ...where },
          clickedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      quarterlyStats.push({
        quarter: quarter + 1,
        clicks: clicksCount
      });
    }

    return {
      monthly: monthlyStats,
      quarterly: quarterlyStats
    };
  }

  async getUserStatsOverTime(userId: number, filters: StatsFilterDto) {
    const isUserAdmin = await this.isAdmin(userId);

    // Xây dựng điều kiện lọc theo thời gian
    let whereClause = '';
    const params: any[] = [];

    if (filters.year) {
      if (filters.periodType === 'month' && filters.month) {
        whereClause = `
          AND YEAR(ac.clicked_at) = ?
          AND MONTH(ac.clicked_at) = ?
        `;
        params.push(filters.year, filters.month);
      } else if (filters.periodType === 'quarter' && filters.quarter) {
        const startMonth = (filters.quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        whereClause = `
          AND YEAR(ac.clicked_at) = ?
          AND MONTH(ac.clicked_at) BETWEEN ? AND ?
        `;
        params.push(filters.year, startMonth, endMonth);
      } else {
        whereClause = `
          AND YEAR(ac.clicked_at) = ?
        `;
        params.push(filters.year);
      }
    }

    // Nếu không phải admin, chỉ lấy dữ liệu của người dùng hiện tại
    if (!isUserAdmin) {
      whereClause += ` AND u.id = ?`;
      params.push(userId);
    }

    // Truy vấn raw SQL
    const query = `
      SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        COUNT(ac.id) as totalClicks,
        SUM(a.commission) as totalCommission
      FROM 
        users u
      LEFT JOIN 
        affiliates a ON u.id = a.user_id
      LEFT JOIN 
        affiliate_clicks ac ON a.id = ac.affiliate_id
      WHERE 
        1=1 ${whereClause}
      GROUP BY 
        u.id, u.name, u.email
      ORDER BY 
        totalClicks DESC, totalCommission DESC
      LIMIT ?
    `;

    params.push(filters.limit || 10);

    return this.prisma.$queryRawUnsafe(query, ...params);
  }
}
