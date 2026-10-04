import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService.changePassword', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const jwt = {} as any;
  const service = new AuthService(prisma, jwt);

  beforeEach(() => jest.clearAllMocks());

  it('changes password after verifying the current password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, passwordHash: 'old' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await expect(service.changePassword('u1', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    })).resolves.toEqual({ message: 'Password changed successfully.' });

    expect(bcrypt.compare).toHaveBeenCalledWith('old-password', 'old');
    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { passwordHash: 'new-hash' },
    });
  });

  it('rejects an incorrect current password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, passwordHash: 'old' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.changePassword('u1', {
      currentPassword: 'wrong',
      newPassword: 'new-password',
    })).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    await expect(service.changePassword('u1', {
      currentPassword: 'same-password',
      newPassword: 'same-password',
    })).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
