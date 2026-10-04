import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpsertExamResultDto } from './dto/upsert-exam-result.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    return this.prisma.exam.findMany({
      where: { academicYear: { schoolId } },
      include: { academicYear: true, _count: { select: { results: true } } },
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
    });
  }

  async create(schoolId: string, dto: CreateExamDto) {
    const year = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!year) throw new ForbiddenException('Academic year does not belong to your school.');
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('Exam end date cannot be before the start date.');
    const duplicate = await this.prisma.exam.findFirst({ where: { academicYearId: dto.academicYearId, name: dto.name.trim() } });
    if (duplicate) throw new ConflictException('An exam with this name already exists for this academic year.');
    return this.prisma.exam.create({ data: { academicYearId: dto.academicYearId, name: dto.name.trim(), startDate: start, endDate: end } });
  }

  async upsertResult(schoolId: string, dto: UpsertExamResultDto) {
    const exam = await this.prisma.exam.findFirst({ where: { id: dto.examId, academicYear: { schoolId } } });
    if (!exam) throw new ForbiddenException('Exam does not belong to your school.');
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId } });
    if (!student) throw new ForbiddenException('Student does not belong to your school.');
    const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
    if (!subject) throw new ForbiddenException('Subject does not belong to your school.');
    if (dto.marks > dto.maxMarks) throw new BadRequestException('Marks cannot exceed maximum marks.');
    return this.prisma.examResult.upsert({
      where: { examId_studentId_subjectId: { examId: dto.examId, studentId: dto.studentId, subjectId: dto.subjectId } },
      update: { marks: dto.marks, maxMarks: dto.maxMarks, grade: dto.grade?.trim() || null, remarks: dto.remarks?.trim() || null },
      create: { examId: dto.examId, studentId: dto.studentId, subjectId: dto.subjectId, marks: dto.marks, maxMarks: dto.maxMarks, grade: dto.grade?.trim() || null, remarks: dto.remarks?.trim() || null },
      include: { subject: true, student: true },
    });
  }

  async reportForStudent(schoolId: string, studentId: string, examId?: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId }, include: { section: { include: { class: true, academicYear: true } } } });
    if (!student) throw new NotFoundException('Student not found.');
    const results = await this.prisma.examResult.findMany({
      where: { studentId, ...(examId ? { examId } : {}), exam: { academicYear: { schoolId } } },
      include: { exam: true, subject: true },
      orderBy: [{ exam: { startDate: 'desc' } }, { subject: { name: 'asc' } }],
    });
    return { student, results };
  }
}
