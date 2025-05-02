import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, IsNotEmpty, MaxLength, ValidateNested, IsArray } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Description of the post',
    type: String,
    maxLength: 65535,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(65535)
  description?: string;

  @ApiProperty({
    description: 'Content of the post',
    type: String,
    maxLength: 3999999999,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3999999999)
  content: string;

  @ApiProperty({
    description: 'main image of the post',
    type: 'string',
    format: 'binary',
    required: true,
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    description: 'Collection name the post belongs to',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiProperty({
    description: 'Publish status of the post',
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {

  @ApiProperty({
    description: 'Title of the post',
    type: String,
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Slug of the post (can be used for SEO)',
    type: String,
    required: false,
  })
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Description of the post',
    type: String,
    maxLength: 65535,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(65535)
  description?: string;

  @ApiProperty({
    description: 'Content of the post',
    type: String,
    maxLength: 3999999999,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3999999999)
  content?: string;

  @ApiProperty({
    description: 'Publish status of the post',
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
