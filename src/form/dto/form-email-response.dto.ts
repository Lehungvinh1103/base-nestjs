import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FormEmailResponseDto {
    @ApiProperty({
        description: "Unique identifier",
        example: 1
    })
    id: number;

    @ApiProperty({
        description: "Email of client user",
        required: true
    })
    email: string;

    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    createdAt: Date;

    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    updatedAt: Date;
}