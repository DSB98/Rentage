import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success property, pass through (for paginated responses)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data has items and meta, it's a paginated response
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true,
            data: data.items,
            meta: data.meta,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
