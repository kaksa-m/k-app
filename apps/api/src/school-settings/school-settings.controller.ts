import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { SchoolSettingsService } from './school-settings.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
@Controller('school-settings')
export class SchoolSettingsController {
  constructor(private service: SchoolSettingsService) {}
  @Get() get(@CurrentUser() user: AuthenticatedUser) { return this.service.get(user.schoolId!); }
  @Roles(Role.SCHOOL_ADMIN)
  @Patch() update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSchoolSettingsDto) { return this.service.update(user.schoolId!, dto); }
}
