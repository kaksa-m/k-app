import { NotFoundException } from '@nestjs/common';
import { TeachersService } from './teachers.service';

function makePrisma() {
  return {
    teacher: {
      findFirst: jest.fn(),
    },
  } as any;
}

describe('TeachersService', () => {
  it('returns the teacher profile and timetable for the authenticated teacher', async () => {
    const prisma = makePrisma();
    const service = new TeachersService(prisma);
    const teacher = { id: 't1', userId: 'u1', schoolId: 's1', classSessions: [] };
    prisma.teacher.findFirst.mockResolvedValue(teacher);

    await expect(service.me('s1', 'u1')).resolves.toEqual(teacher);
    expect(prisma.teacher.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { schoolId: 's1', userId: 'u1' },
    }));
  });

  it('rejects a user without a teacher profile', async () => {
    const prisma = makePrisma();
    const service = new TeachersService(prisma);
    prisma.teacher.findFirst.mockResolvedValue(null);

    await expect(service.me('s1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
