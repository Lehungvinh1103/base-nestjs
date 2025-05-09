import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly rateLimiter = new RateLimiterMemory({
    points: 100, // Number of points
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 15, // Block for 15 minutes if limit exceeded
  });

  private readonly rateLimiterStrict = new RateLimiterMemory({
    points: 10, // Number of points
    duration: 60, // Per 60 seconds
    blockDuration: 60 * 60, // Block for 1 hour if limit exceeded
  });

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const key = this.getKey(req);

      const isStrict = this.shouldUseStrictLimiter(req);
      
      const limiter = isStrict
        ? this.rateLimiterStrict
        : this.rateLimiter;

      await limiter.consume(key);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', (await limiter.get(key))?.remainingPoints ?? 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + limiter.duration * 1000).toISOString());

      next();
    } catch (error) {
      if (error.msBeforeNext) {
        res.setHeader('Retry-After', Math.ceil(error.msBeforeNext / 1000));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
      }

      return res.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });
    }
  }

  private getKey(req: Request): string {
    // Use IP address as key with fallback
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private shouldUseStrictLimiter(req: Request): boolean {
    // Apply strict rate limiting for sensitive endpoints
    const sensitiveEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ];

    // Check originalUrl which contains the full path including global prefix
    return sensitiveEndpoints.some(endpoint => req.originalUrl.endsWith(endpoint));
  }
} 