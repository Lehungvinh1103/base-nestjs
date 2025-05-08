import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { MediaModule } from './media/media.module';
import { ModelHasMediaModule } from './model-has-media/model-has-media.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { MiddlewareModule } from './middleware/middleware.module';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FormModule } from './form/form.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    PostsModule,
    MediaModule,
    ModelHasMediaModule,
    AffiliateModule,
    FormModule,
    RolesModule,
    UsersModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MiddlewareModule,
  ],
})
export class AppModule {}
