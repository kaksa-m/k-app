import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private async validateRelations(schoolId: string, dto: Partial<CreateStudentDto>) {
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } });
      if (!section) throw new ForbiddenException('Section does not belong to your school.');
    }
    if (dto.parentId) {
      const parent = await this.prisma.parent.findFirst({ where: { id: dto.parentId, schoolId } });
      if (!parent) throw new ForbiddenException('Parent does not belong to your school.');
    }
  }

  async create(schoolId: string, dto: CreateStudentDto) {
    await this.validateRelations(schoolId, dto);
    return this.prisma.student.create({
      data: {
        schoolId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        rollNumber: dto.rollNumber,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        sectionId: dto.sectionId,
        parentId: dto.parentId,
      },
    });
  }

  findAll(schoolId: string, filters: { sectionId?: string }) {
    return this.prisma.student.findMany({
      where: { schoolId, isActive: true, ...filters },
      include: { section: { include: { class: true } }, parent: true },
      orderBy: [{ firstName: 'asc' }],
    });
  }

  async findOne(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: { section: { include: { class: true } }, parent: true },
    });
    if (!student) throw new NotFoundException('Student not found.');
    return student;
  }

  async update(schoolId: string, id: string, dto: UpdateStudentDto) {
    await this.findOne(schoolId, id);
    await this.validateRelations(schoolId, dto);
    const { dateOfBirth, ...rest } = dto;
    return this.prisma.student.update({
      where: { id },
      data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined },
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.student.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
