import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  private async validateRelations(schoolId: string, dto: Partial<CreateSectionDto>, excludeId?: string) {
    if (dto.classId) {
      const record = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } });
      if (!record) throw new ForbiddenException('Class does not belong to your school.');
    }
    if (dto.academicYearId) {
      const record = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
      if (!record) throw new ForbiddenException('Academic year does not belong to your school.');
    }
    if (dto.classTeacherId) {
      const record = await this.prisma.teacher.findFirst({ where: { id: dto.classTeacherId, schoolId } });
      if (!record) throw new ForbiddenException('Class teacher does not belong to your school.');
    }

    if (dto.classId && dto.academicYearId && dto.name) {
      const duplicate = await this.prisma.section.findFirst({
        where: { classId: dto.classId, academicYearId: dto.academicYearId, name: dto.name, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      });
      if (duplicate) throw new ForbiddenException('A section with this name already exists for the class and academic year.');
    }
  }

  async create(schoolId: string, dto: CreateSectionDto) {
    await this.validateRelations(schoolId, dto);
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
    const current = await this.findOne(schoolId, id);
    await this.validateRelations(schoolId, dto, id);

    const classId = dto.classId ?? current.classId;
    const academicYearId = dto.academicYearId ?? current.academicYearId;
    const name = dto.name ?? current.name;
    const duplicate = await this.prisma.section.findFirst({
      where: { classId, academicYearId, name, NOT: { id } },
    });
    if (duplicate) throw new ForbiddenException('A section with this name already exists for the class and academic year.');

    return this.prisma.section.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.section.delete({ where: { id } });
    return { success: true };
  }
}
