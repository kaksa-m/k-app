import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  create(schoolId: string, dto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({
      data: { ...dto, schoolId },
    });
  }

  findAll(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!year) throw new NotFoundException('Academic year not found.');
    return year;
  }

  async update(schoolId: string, id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(schoolId, id); // 404s if it doesn't belong to this school
    return this.prisma.academicYear.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.academicYear.delete({ where: { id } });
    return { success: true };
  }
}
