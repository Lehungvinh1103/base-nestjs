import { ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateMediaDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  files: Express.Multer.File[];

  @ApiProperty({ description: 'Collection name for organizing media', default: 'mặc định' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || 'mặc định') 
  collection?: string;

  @ApiProperty({ description: 'Model type that the media belongs to', required: false })
  @IsString()
  @IsOptional()
  model_type?: string;

  @ApiProperty({ description: 'Model ID that the media belongs to', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  model_id?: number;

  @ApiProperty({ description: 'Field type in the model (ex: thumbnail, gallery)', required: false })
  @IsString()
  @IsOptional()
  field_type?: string;

  @ApiProperty({ description: 'User ID who uploaded the media', required: false })
  @IsNumber()
  @IsOptional()
  user_id?: number;
}