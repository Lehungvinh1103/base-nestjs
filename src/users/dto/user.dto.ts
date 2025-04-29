import { Transform } from 'class-transformer';
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MaxLength, MinLength, Matches } from 'class-validator';
import { Match } from 'src/common/validators/match.validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  password: string;

  @IsString()
  @Transform(({ value }) => String(value))
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  currentPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  @Transform(({ value }) => String(value))
  newPassword?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => String(value))
  @Match('newPassword', { message: 'New Passwords do not match' })
  confirmPassword: string;
}

export class UserResponseDto {
  id: number;
  email: string;
  name?: string;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
} 