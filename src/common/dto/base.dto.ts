import { ApiProperty } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';

/**
 * Base DTO class with timestamp handling
 * Extends this class to inherit timestamp fields handling
 */
export class BaseDto {
    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    createdAt: Date;
    
    @ApiProperty()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    updatedAt: Date;
}