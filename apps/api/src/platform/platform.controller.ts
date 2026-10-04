import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformService } from './platform.service';
import { CreateSchoolDto } from './dto/create-school.dto';

@Controller('platform')
@Roles(Role.SUPER_ADMIN)
export class PlatformController {
  constructor(private service: PlatformService) {}

  @Get('overview')
  overview(@CurrentUser() _user: AuthenticatedUser) {
    return this.service.overview();
  }

  @Get('schools')
  schools(@CurrentUser() _user: AuthenticatedUser) {
    return this.service.listSchools();
  }

  @Get('schools/:id')
  school(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getSchool(id);
  }

  @Post('schools')
  createSchool(@CurrentUser() _user: AuthenticatedUser, @Body() dto: CreateSchoolDto) {
    return this.service.createSchool(dto);
  }
}
