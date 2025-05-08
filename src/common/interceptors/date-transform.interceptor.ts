import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Xử lý trường hợp data là một đối tượng
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return this.transformDates(data);
        }
        
        // Xử lý trường hợp data là một mảng
        if (Array.isArray(data)) {
          return data.map(item => this.transformDates(item));
        }
        
        return data;
      }),
    );
  }

  private transformDates(data: any): any {
    const result = { ...data };
    
    if (result.createdAt && Object.keys(result.createdAt).length === 0) {
      result.createdAt = new Date().toISOString(); // Hoặc có thể chuyển thành string: new Date().toISOString()
    }
    
    if (result.updatedAt && Object.keys(result.updatedAt).length === 0) {
      result.updatedAt = null; // Hoặc có thể chuyển thành string: new Date().toISOString()
    }
    
    return result;
  }
}