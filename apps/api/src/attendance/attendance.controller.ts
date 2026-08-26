import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @Post()
  mark(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkAttendanceDto) {
    return this.service.mark(user.schoolId!, dto);
  }

  // GET /attendance/session/:classSessionId?date=2026-08-26
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @Get('session/:classSessionId')
  forSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classSessionId') classSessionId: string,
    @Query('date') date: string,
  ) {
    return this.service.forSession(user.schoolId!, classSessionId, date);
  }

  // GET /attendance/student/:studentId?from=...&to=...
  @Get('student/:studentId')
  forStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.forStudent(user.schoolId!, studentId, from, to);
  }
}
