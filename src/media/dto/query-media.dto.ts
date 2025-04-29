import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class QueryMediaDto {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  per_page?: number = 20;

  @ApiProperty({ required: false, description: 'Filter by collection name' })
  @IsString()
  @IsOptional()
  collection?: string;

  @ApiProperty({ required: false, description: 'Search term for file name or title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Include all selected media' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  include_all_media?: boolean;

  @ApiProperty({ required: false, description: 'Selected media IDs', type: [Number] })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  selected_ids?: number[];
}

export class GetModelMediaDto {
  @ApiProperty({ description: 'Model type that owns the media' })
  @IsString()
  model_type: string;

  @ApiProperty({ description: 'Model ID that owns the media' })
  @IsNumber()
  @Type(() => Number)
  model_id: number;

  @ApiProperty({ required: false, description: 'Filter by collection name' })
  @IsString()
  @IsOptional()
  collection?: string;
}