import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip, headers, body, query, params } = req;

    // Log request
    logger.info('Incoming Request', {
      requestId: req['requestId'],
      method,
      url: originalUrl,
      ip,
      headers,
      body,
      query,
      params,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      // Log response
      logger.info('Request Completed', {
        requestId: req['requestId'],
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
      });

      // Log error if status code is 4xx or 5xx
      if (statusCode >= 400) {
        logger.error('Request Error', {
          requestId: req['requestId'],
          method,
          url: originalUrl,
          statusCode,
          duration: `${duration}ms`,
          ip,
        });
      }
    });

    next();
  }
} 