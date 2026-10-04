import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpsertExamResultDto } from './dto/upsert-exam-result.dto';
import { ExamsService } from './exams.service';

@Controller('exams')
export class ExamsController {
  constructor(private service: ExamsService) {}

  @Roles(Role.SCHOOL_ADMIN)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) { return this.service.findAll(user.schoolId!); }

  @Roles(Role.SCHOOL_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) { return this.service.create(user.schoolId!, dto); }

  @Roles(Role.SCHOOL_ADMIN)
  @Post('results')
  upsertResult(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertExamResultDto) { return this.service.upsertResult(user.schoolId!, dto); }

  @Roles(Role.SCHOOL_ADMIN)
  @Get('report')
  report(@CurrentUser() user: AuthenticatedUser, @Query('studentId') studentId: string, @Query('examId') examId?: string) {
    return this.service.reportForStudent(user.schoolId!, studentId, examId);
  }
}
