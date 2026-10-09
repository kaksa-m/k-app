import { BadRequestException, ConflictException } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';

describe('AcademicYearsService', () => {
  const prisma = {
    academicYear: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;
  let service: AcademicYearsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    service = new AcademicYearsService(prisma);
  });

  it('rejects an invalid date range', async () => {
    await expect(service.create('school-a', {
      name: '2027-28', startDate: '2027-06-01', endDate: '2027-05-31',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicYear.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate academic year name', async () => {
    prisma.academicYear.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.create('school-a', {
      name: '2027-28', startDate: '2027-06-01', endDate: '2028-04-30',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.academicYear.create).not.toHaveBeenCalled();
  });

  it('clears another current year when creating a current year', async () => {
    prisma.academicYear.findFirst.mockResolvedValue(null);
    prisma.academicYear.create.mockResolvedValue({ id: 'new', name: '2027-28', isCurrent: true });

    await service.create('school-a', {
      name: '2027-28', startDate: '2027-06-01', endDate: '2028-04-30', isCurrent: true,
    });

    expect(prisma.academicYear.updateMany).toHaveBeenCalledWith({
      where: { schoolId: 'school-a', isCurrent: true },
      data: { isCurrent: false },
    });
    const createCall = prisma.academicYear.create.mock.calls[0][0];
    expect(createCall.data.startDate).toEqual(new Date('2027-06-01'));
    expect(createCall.data.endDate).toEqual(new Date('2028-04-30'));
  });

  it('does not allow deleting the current year', async () => {
    prisma.academicYear.findFirst.mockResolvedValue({ id: 'year-a', schoolId: 'school-a', isCurrent: true });
    await expect(service.remove('school-a', 'year-a')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.academicYear.delete).not.toHaveBeenCalled();
  });
});
