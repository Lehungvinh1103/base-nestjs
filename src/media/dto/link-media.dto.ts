import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkMediaDto {
  @ApiProperty({ type: [Number], description: 'Array of media IDs to link' })
  @IsArray()
  @IsNumber({}, { each: true })
  media_ids: number[];

  @ApiProperty({ description: 'Model type to link the media to' })
  @IsString()
  model_type: string;

  @ApiProperty({ description: 'Model ID to link the media to' })
  @IsNumber()
  model_id: number;

  @ApiProperty({ description: 'Field type in the model (ex: thumbnail, gallery)', required: false })
  @IsString()
  @IsOptional()
  field_type?: string;

  @ApiProperty({ description: 'Collection name for organizing media', required: false })
  @IsString()
  @IsOptional()
  collection?: string;
}