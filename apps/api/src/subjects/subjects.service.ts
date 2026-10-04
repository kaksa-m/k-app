import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  // Verifies every given class id actually belongs to this school before
  // letting a subject connect to it — without this, a subject could be
  // wired to another school's class by id guess.
  private async assertClassesInSchool(schoolId: string, classIds: string[]) {
    if (classIds.length === 0) return;
    const count = await this.prisma.class.count({ where: { id: { in: classIds }, schoolId } });
    if (count !== classIds.length) {
      throw new ForbiddenException('One or more classes do not belong to your school.');
    }
  }

  async create(schoolId: string, dto: CreateSubjectDto) {
    const classIds = dto.classIds ?? [];
    await this.assertClassesInSchool(schoolId, classIds);

    return this.prisma.subject.create({
      data: {
        schoolId,
        name: dto.name,
        code: dto.code,
        classes: classIds.length ? { connect: classIds.map((id) => ({ id })) } : undefined,
      },
      include: { classes: true },
    });
  }

  findAll(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      include: { classes: true },
      orderBy: { name: 'asc' },
    });
  }

  // Powers the Timetable page's subject picker: only subjects assigned
  // to this specific class.
  findForClass(schoolId: string, classId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId, classes: { some: { id: classId } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
      include: { classes: true },
    });
    if (!subject) throw new NotFoundException('Subject not found.');
    return subject;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    await this.findOne(schoolId, id);
    const { classIds, ...rest } = dto;

    if (classIds !== undefined) {
      await this.assertClassesInSchool(schoolId, classIds);
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        ...rest,
        // `set` replaces the whole list — correct for "these are now the
        // classes this subject belongs to" semantics from an edit form,
        // as opposed to `connect` which would only add.
        ...(classIds !== undefined ? { classes: { set: classIds.map((cid) => ({ id: cid })) } } : {}),
      },
      include: { classes: true },
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true };
  }
}
