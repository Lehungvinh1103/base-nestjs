import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
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
    new winston.transports.File({ filename: 'logs/error.log' }),
  ],
});

@Catch()
export class ErrorHandlerMiddleware implements ExceptionFilter {
  private readonly logger = new Logger(ErrorHandlerMiddleware.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;
    let validationErrors: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        errorCode = exceptionResponse['error'];
        validationErrors = exceptionResponse['errors'];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error with request context
    const errorLog = {
      requestId: request['requestId'],
      status,
      message,
      errorCode,
      validationErrors,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
      user: request.user ? { id: request.user['id'], email: request.user['email'] } : undefined,
    };

    logger.error('Error occurred', errorLog);
    this.logger.error(JSON.stringify(errorLog, null, 2));

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
      validationErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request['requestId'],
    });
  }
} 