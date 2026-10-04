import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
@Controller('audit-logs')
export class AuditLogController {
  constructor(private service: AuditLogService) {}
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) { return user.schoolId ? this.service.list(user.schoolId) : []; }
}
