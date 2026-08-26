import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  schoolId: string | null;
}

// Usage: findAll(@CurrentUser() user: AuthenticatedUser)
// Populated by JwtStrategy.validate() — see auth/jwt.strategy.ts.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
