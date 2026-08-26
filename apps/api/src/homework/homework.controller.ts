import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('homework')
export class HomeworkController {
  constructor(private service: HomeworkService) {}

  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHomeworkDto) {
    return this.service.create(user.schoolId!, dto);
  }

  @Get()
  forSession(@CurrentUser() user: AuthenticatedUser, @Query('classSessionId') classSessionId: string) {
    return this.service.forSession(user.schoolId!, classSessionId);
  }

  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.schoolId!, id);
  }
}
