import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ClassworkService } from './classwork.service';
import { CreateClassworkDto } from './dto/create-classwork.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('classwork')
export class ClassworkController {
  constructor(private service: ClassworkService) {}

  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassworkDto) {
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
