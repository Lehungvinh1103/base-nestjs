import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAffiliateClickDto {
  @ApiProperty({
    description: 'The affiliate code',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The token generated from frontend',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
} 