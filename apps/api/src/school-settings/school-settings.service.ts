import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
@Injectable()
export class SchoolSettingsService {
  constructor(private prisma: PrismaService) {}
  get(schoolId: string) { return this.prisma.school.findUnique({ where: { id: schoolId }, select: { id:true,name:true,slug:true,city:true,timezone:true,address:true,phone:true,email:true,logoUrl:true,primaryColor:true,secondaryColor:true } }); }
  async update(schoolId: string, dto: UpdateSchoolSettingsDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new ForbiddenException('School not found.');
    return this.prisma.school.update({ where: { id: schoolId }, data: { ...dto, name: dto.name?.trim(), city: dto.city?.trim(), address: dto.address?.trim(), phone: dto.phone?.trim(), email: dto.email?.trim().toLowerCase(), logoUrl: dto.logoUrl?.trim() } });
  }
}
