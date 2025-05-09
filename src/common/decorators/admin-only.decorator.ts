// src/common/decorators/admin-only.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionGuard, AdminGuard),
  );
}
