import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';
export const RequiredPermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission); 