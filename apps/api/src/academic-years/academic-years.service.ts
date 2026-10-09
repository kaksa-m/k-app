import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  private validateDates(startDate: string | Date, endDate: string | Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      throw new BadRequestException('End date must be later than start date.');
    }
  }

  private async ensureUniqueName(schoolId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.academicYear.findFirst({
      where: {
        schoolId,
        name,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('An academic year with this name already exists.');
  }

  async create(schoolId: string, dto: CreateAcademicYearDto) {
    this.validateDates(dto.startDate, dto.endDate);
    await this.ensureUniqueName(schoolId, dto.name);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.create({
        data: {
          ...dto,
          schoolId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      });
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
    const current = await this.findOne(schoolId, id);
    const startDate = dto.startDate ?? current.startDate;
    const endDate = dto.endDate ?? current.endDate;
    const name = dto.name ?? current.name;

    this.validateDates(startDate, endDate);
    await this.ensureUniqueName(schoolId, name, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent === true) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true, NOT: { id } },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
          ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
        },
      });
    });
  }

  async remove(schoolId: string, id: string) {
    const year = await this.findOne(schoolId, id);
    if (year.isCurrent) {
      throw new BadRequestException('Set another academic year as current before deleting this one.');
    }

    await this.prisma.academicYear.delete({ where: { id } });
    return { success: true };
  }
}
