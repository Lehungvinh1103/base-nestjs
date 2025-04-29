import { ApiProperty } from '@nestjs/swagger';
import { CustomProperties } from '../interfaces/custom-properties.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  disk: string;

  @ApiProperty()
  customProperties: CustomProperties;
}

export class AttachMediaDto {
  @ApiProperty()
  mediaId: number;

  @ApiProperty()
  modelType: string;

  @ApiProperty()
  modelId: number;

  @ApiProperty()
  fieldType: string;
}

export class UploadMediaDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;

  @ApiProperty()
  modelType?: string;

  @ApiProperty()
  modelId?: number;

  @ApiProperty()
  fieldType?: string;
} 

export class MediaDto {
  @IsString()
  @IsNotEmpty()
  file: string; // Đường dẫn hoặc dữ liệu file, tùy vào cách bạn upload media

  @IsOptional()
  @IsString()
  collection?: string; // Tên collection cho media (nếu có)
}