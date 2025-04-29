import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, UpdatePermissionDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Role CRUD
  async createRole(createRoleDto: CreateRoleDto) {
    const { permissionIds, ...roleData } = createRoleDto;

    return this.prisma.role.create({
      data: {
        ...roleData,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const { permissionIds, ...roleData } = updateRoleDto;

    // First, delete all existing role permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    return this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: {
                  connect: { id: permissionId },
                },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async removeRole(id: number) {
    // First, delete all role permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    return this.prisma.role.delete({
      where: { id },
    });
  }

  // Permission CRUD
  async createPermission(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }

  async findPermissionById(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto) {
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async removePermission(id: number) {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
} 