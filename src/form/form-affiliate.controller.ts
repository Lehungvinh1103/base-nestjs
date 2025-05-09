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
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { ApiTags } from '@nestjs/swagger';
import { FormService } from './form.service';
import {
    CreateFormAffDto,
    UpdateFormAffDto,
} from './dto/form-affiliate.dto';
import { FormAffResponseDto } from './dto/form-aff-response.dto';
import { plainToInstance } from 'class-transformer';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

@ApiTags('Form')
@Controller('form-affiliate')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FormAffiliateController {
    constructor(private readonly formService: FormService) {}

    @Post()
    @Public()
    async create(@Body() dto: CreateFormAffDto) {
        const result = await this.formService.createFormAffiliate(dto);
        return plainToInstance(FormAffResponseDto, result);
    }

    @Get(':id')
    @AdminOnly()
    async findOne(@Param('id') id: string) {
        const result = await this.formService.getFormAffiliate(+id);
        return plainToInstance(FormAffResponseDto, result);
    }

    @Get()
    @AdminOnly()
    async findAll() {
        const result = await this.formService.getAllFormAffiliate();
        return plainToInstance(FormAffResponseDto, result);
    }

    @Patch(':id')
    @AdminOnly()
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateFormAffDto,
    ) {
        const result = await this.formService.updateFormAffiliate(+id, dto);
        return plainToInstance(FormAffResponseDto, result);
    }

    @Delete(':id')
    @AdminOnly()
    async remove(@Param('id') id: string) {
        const result = await this.formService.deleteFormAffiliate(+id);
        return plainToInstance(FormAffResponseDto, result);
    }
}
