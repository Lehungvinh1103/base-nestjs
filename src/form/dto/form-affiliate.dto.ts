import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFormAffDto {
    @ApiProperty({
        description: "Username of client user",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: "link of client user",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    link: string;

    @ApiProperty({
        description: "referral id number",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: "Email of client user",
        required: true
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class UpdateFormAffDto{
    @ApiProperty({
        description: "Username of client user",
        required: false
    })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({
        description: "link of client user",
        required: false
    })
    @IsString()
    @IsOptional()
    link?: string;

    @ApiProperty({
        description: "referral id number",
        required: false
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({
        description: "Email of client user",
        required: false
    })
    @IsEmail()
    @IsOptional()
    email?: string;
}