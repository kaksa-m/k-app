import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  create(schoolId: string, dto: CreateClassDto) {
    return this.prisma.class.create({ data: { ...dto, schoolId } });
  }

  findAll(schoolId: string) {
    return this.prisma.class.findMany({
      where: { schoolId },
      orderBy: { order: 'asc' },
      include: { sections: true },
    });
  }

  async findOne(schoolId: string, id: string) {
    const klass = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: { sections: true },
    });
    if (!klass) throw new NotFoundException('Class not found.');
    return klass;
  }

  async update(schoolId: string, id: string, dto: UpdateClassDto) {
    await this.findOne(schoolId, id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.class.delete({ where: { id } });
    return { success: true };
  }
}
