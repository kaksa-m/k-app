import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Usage: @Public() on a controller method to skip the global JwtAuthGuard
// (e.g. POST /auth/login, POST /auth/register-school).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
