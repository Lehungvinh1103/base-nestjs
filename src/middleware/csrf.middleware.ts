import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF in development
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Skip CSRF for webhook endpoints
    if (req.path.startsWith('/webhook/')) {
      return next();
    }

    // Apply CSRF protection
    this.csrfProtection(req, res, (err) => {
      if (err) {
        // Handle CSRF token errors
        if (err.code === 'EBADCSRFTOKEN') {
          return res.status(403).json({
            statusCode: 403,
            message: 'Invalid CSRF token',
            error: 'Forbidden',
          });
        }
        return next(err);
      }

      // Add CSRF token to response headers
      res.setHeader('X-CSRF-Token', req.csrfToken());
      next();
    });
  }
} 