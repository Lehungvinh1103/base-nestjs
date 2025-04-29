import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomPropertiesDto {
  @ApiProperty({ description: 'Alt text for the media', required: false })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({ description: 'Title for the media', required: false })
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateMediaDto {
  @ApiProperty({
    description: 'Custom properties (must be a plain JSON object)',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  custom_properties?: Record<string, any>;
}