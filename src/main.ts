import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new BigIntInterceptor());

  // Enable CORS with specific options
  app.enableCors({
  origin: (origin, callback) => {
    // Danh sách các origin được phép
    const allowedOrigins = ['https://maximagoldhedging.com', 'http://localhost:3000'];

    // Nếu không có origin (như curl) hoặc origin nằm trong danh sách cho phép
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cho phép gửi cookie/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
  

  // Serve static files from root directory before setting global prefix
  const rootPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(rootPath, {
    index: false,
    fallthrough: true,
  }));

  // Set global prefix after static files
  app.setGlobalPrefix('api', {
    exclude: ['/uploads/*'],
  });

  // Use cookie parser
  app.use(cookieParser());

  // Use helmet for security headers with custom CSP
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          imgSrc: [`'self'`, 'data:', 'blob:', '*'],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Media API')
    .setDescription('API for managing media files')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Static path:', rootPath);
}
bootstrap();
