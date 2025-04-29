import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, UpdatePermissionDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequiredPermission } from '../common/decorators/required-permission.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Role endpoints
  @Post()
  @RequiredPermission('manage:roles')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @RequiredPermission('view:roles')
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get(':id')
  @RequiredPermission('view:roles')
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(+id);
  }

  @Patch(':id')
  @RequiredPermission('manage:roles')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.updateRole(+id, updateRoleDto);
  }

  @Delete(':id')
  @RequiredPermission('manage:roles')
  removeRole(@Param('id') id: string) {
    return this.rolesService.removeRole(+id);
  }

  // Permission endpoints
  @Post('permissions')
  @RequiredPermission('manage:permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @RequiredPermission('view:permissions')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get('permissions/:id')
  @RequiredPermission('view:permissions')
  findPermissionById(@Param('id') id: string) {
    return this.rolesService.findPermissionById(+id);
  }

  @Patch('permissions/:id')
  @RequiredPermission('manage:permissions')
  updatePermission(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.rolesService.updatePermission(+id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  @RequiredPermission('manage:permissions')
  removePermission(@Param('id') id: string) {
    return this.rolesService.removePermission(+id);
  }
} 