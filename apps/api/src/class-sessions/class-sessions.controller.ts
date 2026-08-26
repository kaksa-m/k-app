import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId') sectionId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('dayOfWeek', new ParseIntPipe({ optional: true })) dayOfWeek?: number,
  ) {
    if (sectionId) return this.service.findForSection(user.schoolId!, sectionId);
    if (teacherId) return this.service.findForTeacher(user.schoolId!, teacherId, dayOfWeek);
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
