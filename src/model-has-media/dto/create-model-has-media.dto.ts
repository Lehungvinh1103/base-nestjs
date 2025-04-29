import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModelHasMediaDto {
  @ApiProperty({ description: 'Media ID to link' })
  @IsNumber()
  media_id: number;

  @ApiProperty({ description: 'Model type to link the media to' })
  @IsString()
  model_type: string;

  @ApiProperty({ description: 'Model ID to link the media to' })
  @IsNumber()
  model_id: number;

  @ApiProperty({ description: 'Field type in the model (ex: thumbnail, gallery)' })
  @IsString()
  field_type: string;
}