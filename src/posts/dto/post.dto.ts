import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, IsNotEmpty, minLength, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { MediaDto } from 'src/media/dto/media.dto';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(65535)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3999999999)
  content: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  files?: Express.Multer.File[];

  @IsOptional()
  @IsArray()
  media_ids?: number[];

  @IsOptional()
  @IsString()
  collection?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(65535)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3999999999)
  content?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
} 