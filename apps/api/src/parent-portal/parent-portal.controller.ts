import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ParentPortalService } from './parent-portal.service';

@Controller('parent-portal')
export class ParentPortalController {
  constructor(private service: ParentPortalService) {}

  @Roles(Role.PARENT)
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.dashboard(user.userId, user.schoolId!);
  }
}
