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

@ApiTags('Form Emails')
@Controller('form-emails')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FormEmailController {
    constructor(private readonly formService: FormService) { }

    private getIsAdmin(req): boolean {
        return req.user?.role?.name === 'admin';
    }

    @Post()
    @Public()
    create(@Request() req, @Body() dto: CreateFormEmailDto) {
        return this.formService.createFormEmail(dto);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.formService.getFormEmail(+id);
    }
    @Get()
    findAll(@Request() req) {
        return this.formService.getAllFormEmail();
    }

    @Patch(':id')
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateFormEmailDto,
    ) {
        return this.formService.updateFormEmail(+id, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.formService.deleteFormEmail(+id);
    }

}
