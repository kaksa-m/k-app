import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  create(schoolId: string, dto: CreateSectionDto) {
    return this.prisma.section.create({ data: { ...dto, schoolId } });
  }

  findAll(schoolId: string, filters: { classId?: string; academicYearId?: string }) {
    return this.prisma.section.findMany({
      where: { schoolId, ...filters },
      include: { class: true, academicYear: true, classTeacher: true, students: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, schoolId },
      include: { class: true, academicYear: true, classTeacher: true, students: true },
    });
    if (!section) throw new NotFoundException('Section not found.');
    return section;
  }

  async update(schoolId: string, id: string, dto: UpdateSectionDto) {
    await this.findOne(schoolId, id);
    return this.prisma.section.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.section.delete({ where: { id } });
    return { success: true };
  }
}
