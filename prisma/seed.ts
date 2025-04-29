import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const permissions = await Promise.all([
    // Post permissions
    prisma.permission.create({
      data: {
        name: 'create:post',
        description: 'Permission to create posts',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'update:post',
        description: 'Permission to update posts',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'delete:post',
        description: 'Permission to delete posts',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'view:post',
        description: 'Permission to view posts',
      },
    }),

    // Affiliate permissions
    prisma.permission.create({
      data: {
        name: 'create:affiliate',
        description: 'Permission to create affiliates',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'update:affiliate',
        description: 'Permission to update affiliates',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'delete:affiliate',
        description: 'Permission to delete affiliates',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'view:affiliate',
        description: 'Permission to view affiliates',
      },
    }),

    // User permissions
    prisma.permission.create({
      data: {
        name: 'create:user',
        description: 'Permission to create users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'update:user',
        description: 'Permission to update users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'delete:user',
        description: 'Permission to delete users',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'view:user',
        description: 'Permission to view users',
      },
    }),

    // Role permissions
    prisma.permission.create({
      data: {
        name: 'manage:roles',
        description: 'Permission to manage roles',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'view:roles',
        description: 'Permission to view roles',
      },
    }),

    // Permission permissions
    prisma.permission.create({
      data: {
        name: 'manage:permissions',
        description: 'Permission to manage permissions',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'view:permissions',
        description: 'Permission to view permissions',
      },
    }),
  ]);

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator role with full access',
      permissions: {
        create: permissions.map((permission) => ({
          permission: {
            connect: { id: permission.id },
          },
        })),
      },
    },
  });

  const editorRole = await prisma.role.create({
    data: {
      name: 'editor',
      description: 'Editor role with post management access',
      permissions: {
        create: [
          { permission: { connect: { id: permissions[0].id } } }, // create:post
          { permission: { connect: { id: permissions[1].id } } }, // update:post
          { permission: { connect: { id: permissions[2].id } } }, // delete:post
          { permission: { connect: { id: permissions[3].id } } }, // view:post
          { permission: { connect: { id: permissions[4].id } } }, // create:affiliate
          { permission: { connect: { id: permissions[5].id } } }, // update:affiliate
          { permission: { connect: { id: permissions[6].id } } }, // delete:affiliate
          { permission: { connect: { id: permissions[7].id } } }, // view:affiliate
        ],
      },
    },
  });

  const affiliateManagerRole = await prisma.role.create({
    data: {
      name: 'affiliate_manager',
      description: 'Affiliate manager role',
      permissions: {
        create: [
          { permission: { connect: { id: permissions[4].id } } }, // create:affiliate
          { permission: { connect: { id: permissions[5].id } } }, // update:affiliate
          { permission: { connect: { id: permissions[6].id } } }, // delete:affiliate
          { permission: { connect: { id: permissions[7].id } } }, // view:affiliate
        ],
      },
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'user',
      description: 'Basic user role',
      permissions: {
        create: [
          { permission: { connect: { id: permissions[3].id } } }, // view:post
          { permission: { connect: { id: permissions[7].id } } }, // view:affiliate
        ],
      },
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 