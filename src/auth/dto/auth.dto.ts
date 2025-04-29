import { IsEmail, IsString, MinLength, IsOptional, IsNumber, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Match } from '../../common/validators/match.validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(100)
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
  @MaxLength(100)
  name?: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @Transform(({ value }) => String(value))
  password: string;
} 