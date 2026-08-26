import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  create(schoolId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({ data: { ...dto, schoolId } });
  }

  findAll(schoolId: string) {
    return this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findOne(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId } });
    if (!subject) throw new NotFoundException('Subject not found.');
    return subject;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    await this.findOne(schoolId, id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true };
  }
}
