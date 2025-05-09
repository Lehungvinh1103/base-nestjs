import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { BaseDto } from '../../common/dto/base.dto';

/**
 * Response DTO for FormAff
 * Inherits timestamp handling from BaseDto
 */
export class FormAffResponseDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'Username of client user',
        example: 'johndoe'
    })
    username: string;

    @ApiProperty({
        description: 'Link of client user',
        example: 'https://example.com/ref/johndoe'
    })
    link: string;

    @ApiProperty({
        description: 'Referral id number',
        example: 'REF123'
    })
    code: string;

    @ApiProperty({
        description: 'Email of client user',
        example: 'john.doe@example.com'
    })
    email: string;

    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    createdAt: Date;

    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    updatedAt: Date;
}