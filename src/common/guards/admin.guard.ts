// src/common/guards/admin.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
  } from '@nestjs/common';
  
  @Injectable()
  export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (user?.role?.name === 'admin') {
        return true;
      }
  
      throw new ForbiddenException('Admin access only');
    }
  }
  