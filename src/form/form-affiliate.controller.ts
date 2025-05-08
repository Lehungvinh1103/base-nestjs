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
    Headers,
    Ip,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormService } from './form.service';
import { CreateFormEmailDto, UpdateFormEmailDto } from './dto/form-email.dto';
import { CreateFormAffDto, UpdateFormAffDto } from './dto/form-affiliate.dto';

@ApiTags('Form')
@Controller('form-affiliate')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FormAffiliateController {
    constructor(private readonly formService: FormService) { }

    private getIsAdmin(req): boolean {
        return req.user?.role?.name === 'admin';
    }

    @Post()
    @Public()
    create(@Request() req, @Body() dto: CreateFormAffDto) {
        return this.formService.createFormAffiliate(dto);
    }

    @Get(':id')
    @Public()
    findOne(@Request() req, @Param('id') id: string) {
        return this.formService.getFormAffiliate(+id);
    }

    @Get()
    @Public()
    findAll(@Request() req) {
        return this.formService.getAllFormAffiliate();
    }

    @Patch(':id')
    @Public()
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateFormAffDto,
    ) {
        return this.formService.updateFormAffiliate(+id, dto);
    }

    @Delete(':id')
    @Public()
    remove(@Request() req, @Param('id') id: string) {
        return this.formService.deleteFormAffiliate(+id);
    }


}
