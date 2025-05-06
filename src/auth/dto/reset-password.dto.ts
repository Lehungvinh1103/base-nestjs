import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/validators/match.validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: "Email of the account that needs to reset password",
        required:true
    })
    @IsEmail()
    email: string;

    @ApiProperty({ 
        description: 'Token đặt lại mật khẩu đã được gửi qua email',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ 
        description: 'New password (at least 8 characters, including uppercase, lowercase, numbers and special characters)',
        minLength: 8,
        required:true 
      })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    })
    @Transform(({ value }) => String(value))
    newPassword: string;

    @ApiProperty({ description: 'Confirm password' })
    @IsString()
    @Transform(({ value }) => String(value))
    @Match('newPassword', { message: 'Passwords do not match' })
    confirmPassword: string;
} 