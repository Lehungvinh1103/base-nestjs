import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum PeriodType {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export class StatsFilterDto {
  @ApiProperty({
    description: 'Loại khoảng thời gian muốn lọc (tháng/quý/năm)',
    enum: PeriodType,
    required: false,
    example: 'month'
  })
  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType;

  @ApiProperty({
    description: 'Tháng muốn lọc (1-12)',
    minimum: 1,
    maximum: 12,
    required: false,
    example: 5
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiProperty({
    description: 'Quý muốn lọc (1-4)',
    minimum: 1,
    maximum: 4,
    required: false,
    example: 2
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  quarter?: number;

  @ApiProperty({
    description: 'Năm muốn lọc',
    minimum: 2000,
    required: false,
    example: 2025
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiProperty({
    description: 'Số lượng kết quả tối đa trả về',
    minimum: 1,
    default: 10,
    required: false,
    example: 10
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10; // Mặc định lấy top 10
}