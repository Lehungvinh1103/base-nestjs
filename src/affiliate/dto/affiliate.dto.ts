import { IsString, IsNumber, IsOptional, IsNotEmpty, Min, Max, IsInt } from 'class-validator';

export class CreateAffiliateDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commission?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  clicks?: number;

  @IsInt()
  @IsOptional()
  userId?: number;
}

export class UpdateAffiliateDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commission?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  clicks?: number;

  @IsInt()
  @IsOptional()
  userId?: number;
} 