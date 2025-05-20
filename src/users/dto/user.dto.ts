import { Media } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MaxLength, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Match } from 'src/common/validators/match.validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'The password of the user, must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    type: String,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  password: string;

  @ApiProperty({
    description: 'Confirmation password',
    type: String,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @Transform(({ value }) => String(value))
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'The name of the user',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The affiliate code of the user (optional)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  codeAff?: string;

  @ApiProperty({
    description: 'Avatar of the user',
    type: 'string',
    required: false,
  })
  @IsOptional()
  avatar?: any;

  @ApiProperty({
    description: 'Role ID for the user',
    type: Number,
  })
  @IsNumber()
  @Transform(({ value }) => {
    return value ? Number(value) : undefined;
  })
  roleId: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The email of the user',
    type: String,
    maxLength: 255,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'The affiliate code of the user (optional)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  codeAff?: string;

  @ApiProperty({
    description: 'Avatar of the user',
    type: 'string',
    required: false,
  })
  @IsOptional()
  avatar?: any;

  @ApiPropertyOptional({
    description: 'The password of the user',
    type: String,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @IsOptional()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  password?: string;

  @ApiPropertyOptional({
    description: 'The name of the user',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Role ID for the user',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  roleId?: number;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The name of the user',
    type: String,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Avatar of the user',
    type: 'string',
    required: false,
  })
  @IsOptional()
  avatar?: any;

  @ApiPropertyOptional({
    description: 'The current password of the user',
    type: String,
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'The new password for the user',
    type: String,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  newPassword?: string;

  @ApiPropertyOptional({
    description: 'Confirmation of the new password',
    type: String,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => String(value))
  @Match('newPassword', { message: 'New Passwords do not match' })
  confirmPassword: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'The name of the user',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'The role ID of the user',
    type: Number,
  })
  roleId: number | null;

  @ApiProperty()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: Date;
  
  @ApiProperty()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The avatar of the user, can be a URL or media object',
    type: String,
    nullable: true,
  })
  avatar?: Media | string | null;
}
