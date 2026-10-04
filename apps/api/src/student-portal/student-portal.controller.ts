import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentPortalService } from './student-portal.service';

@Controller('student-portal')
export class StudentPortalController {
  constructor(private service: StudentPortalService) {}

  @Roles(Role.STUDENT)
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthenticatedUser) { return this.service.dashboard(user.userId, user.schoolId!); }
}
