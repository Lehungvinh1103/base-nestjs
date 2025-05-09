import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { FormService } from './form.service';
import {
    CreateFormEmailDto,
    UpdateFormEmailDto,
} from './dto/form-email.dto';
import { FormEmailResponseDto } from './dto/form-email-response.dto';
import { plainToInstance } from 'class-transformer';
import { RequiredPermission } from 'src/common/decorators/required-permission.decorator';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

@ApiTags('Form Emails')
@Controller('form-emails')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FormEmailController {
    constructor(private readonly formService: FormService) {}

    @Post()
    @Public()
    async create(@Body() dto: CreateFormEmailDto) {
        const result = await this.formService.createFormEmail(dto);
        return plainToInstance(FormEmailResponseDto, result);
    }

    @Get(':id')
    @AdminOnly()
    async findOne(@Param('id') id: string) {
        const result = await this.formService.getFormEmail(+id);
        return plainToInstance(FormEmailResponseDto, result);
    }

    @Get()
    @AdminOnly()
    async findAll() {
        const result = await this.formService.getAllFormEmail();
        return plainToInstance(FormEmailResponseDto, result);
    }

    @Patch(':id')
    @AdminOnly()
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateFormEmailDto,
    ) {
        const result = await this.formService.updateFormEmail(+id, dto);
        return plainToInstance(FormEmailResponseDto, result);
    }

    @Delete(':id')
    @AdminOnly()
    async remove(@Param('id') id: string) {
        const result = await this.formService.deleteFormEmail(+id);
        return plainToInstance(FormEmailResponseDto, result);
    }
}
