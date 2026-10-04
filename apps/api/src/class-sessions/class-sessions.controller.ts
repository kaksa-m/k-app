import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('class-sessions')
export class ClassSessionsController {
  constructor(private service: ClassSessionsService) {}

  @Roles(Role.SCHOOL_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassSessionDto) {
    return this.service.create(user.schoolId!, dto);
  }

  // GET /class-sessions?sectionId=...  — a section's weekly timetable
  // GET /class-sessions?teacherId=...&dayOfWeek=0  — "today's classes" for a teacher
  //
  // dayOfWeek is parsed manually (not via ParseIntPipe) because Nest runs
  // every parameter pipe on every call to this handler regardless of which
  // query params are actually present — ParseIntPipe's `optional` flag
  // doesn't reliably skip the case where the param is simply absent from
  // the URL, which threw "Validation failed (numeric string is expected)"
  // on every plain ?sectionId=... request.
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId') sectionId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('dayOfWeek') dayOfWeekRaw?: string,
  ) {
    if (sectionId) return this.service.findForSection(user.schoolId!, sectionId);
    if (teacherId) {
      const dayOfWeek = dayOfWeekRaw !== undefined && dayOfWeekRaw !== '' ? Number(dayOfWeekRaw) : undefined;
      return this.service.findForTeacher(user.schoolId!, teacherId, dayOfWeek);
    }
    return [];
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user.schoolId!, id);
  }

  @Roles(Role.SCHOOL_ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.service.update(user.schoolId!, id, dto);
  }

  @Roles(Role.SCHOOL_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.schoolId!, id);
  }
}
