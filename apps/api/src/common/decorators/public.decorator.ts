import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as publicly accessible (skips JwtAuthGuard).
 *
 * @example
 * ```ts
 * @Public()
 * @Get('health')
 * health() { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
