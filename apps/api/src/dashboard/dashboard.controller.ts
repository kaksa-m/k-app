import { Controller, ForbiddenException, Get, NotFoundException, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private service: DashboardService,
    private prisma: PrismaService,
  ) {}

  @Roles(Role.SCHOOL_ADMIN)
  @Get('admin')
  adminToday(@CurrentUser() user: AuthenticatedUser) {
    return this.service.adminToday(user.schoolId!);
  }

  // A teacher only ever sees their own "today" — resolved from their own
  // user id rather than a path param, so there's no way to pass someone
  // else's teacherId and view their schedule.
  @Roles(Role.TEACHER)
  @Get('teacher/me')
  async teacherToday(@CurrentUser() user: AuthenticatedUser) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found for this account.');
    return this.service.teacherToday(user.schoolId!, teacher.id);
  }

  // A parent can only view their own children — verified via the Parent
  // profile's linked students before the dashboard query runs.
  @Roles(Role.PARENT, Role.SCHOOL_ADMIN)
  @Get('parent/:studentId')
  async parentToday(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    if (user.role === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({ where: { userId: user.userId } });
      const owns = parent && (await this.prisma.student.findFirst({ where: { id: studentId, parentId: parent.id } }));
      if (!owns) throw new ForbiddenException('This student is not linked to your account.');
    }
    return this.service.parentToday(user.schoolId!, studentId);
  }
}
