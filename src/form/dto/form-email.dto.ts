import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFormEmailDto {
    @ApiProperty({
            description: "Email of client user",
            required:true
        })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class UpdateFormEmailDto {
    @IsEmail()
    @IsOptional()
    email?: string;
}