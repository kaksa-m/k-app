import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';

// ClassSession has no schoolId column of its own — it's scoped through
// Section, which does. Every method below verifies the section (and, on
// create, the subject/teacher) actually belongs to the caller's school
// before touching anything, so one school can never read or write
// another school's timetable.
@Injectable()
export class ClassSessionsService {
  constructor(private prisma: PrismaService) {}

  private async assertSectionInSchool(schoolId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId } });
    if (!section) throw new ForbiddenException('Section does not belong to your school.');
  }

  async create(schoolId: string, dto: CreateClassSessionDto) {
    await this.assertSectionInSchool(schoolId, dto.sectionId);
    const [subject, teacher] = await Promise.all([
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
      this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId } }),
    ]);
    if (!subject) throw new ForbiddenException('Subject does not belong to your school.');
    if (!teacher) throw new ForbiddenException('Teacher does not belong to your school.');

    return this.prisma.classSession.create({ data: dto });
  }

  findForSection(schoolId: string, sectionId: string) {
    return this.prisma.classSession.findMany({
      where: { sectionId, section: { schoolId } },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findForTeacher(schoolId: string, teacherId: string, dayOfWeek?: number) {
    return this.prisma.classSession.findMany({
      where: { teacherId, teacher: { schoolId }, ...(dayOfWeek !== undefined ? { dayOfWeek } : {}) },
      include: { subject: true, section: { include: { class: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(schoolId: string, id: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id, section: { schoolId } },
      include: { subject: true, teacher: true, section: { include: { class: true } } },
    });
    if (!session) throw new NotFoundException('Class session not found.');
    return session;
  }

  async update(schoolId: string, id: string, dto: UpdateClassSessionDto) {
    await this.findOne(schoolId, id);
    return this.prisma.classSession.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.classSession.delete({ where: { id } });
    return { success: true };
  }
}
