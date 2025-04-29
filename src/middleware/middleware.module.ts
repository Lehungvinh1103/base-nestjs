import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { RequestIdMiddleware } from './request-id.middleware';
import { APP_FILTER } from '@nestjs/core';
import { ErrorHandlerMiddleware } from './error-handler.middleware';
import { CsrfMiddleware } from './csrf.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorHandlerMiddleware,
    },
  ],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,
        LoggerMiddleware,
        RateLimitMiddleware,
        CsrfMiddleware,
      )
      .forRoutes('*');
  }
} 