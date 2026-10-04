import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditLogService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.audit.record({ schoolId: user.schoolId, userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });
    return this.buildAuthResponse(user.id, user.email, user.role, user.schoolId, user.name);
  }


  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    // Deliberately generic to prevent account enumeration. In production, an
    // email provider should consume the generated token through the same service boundary.
    if (!user || !user.isActive) return { message: 'If the account exists, a reset link has been sent.' };
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const raw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    const response: any = { message: 'If the account exists, a reset link has been sent.' };
    if (process.env.NODE_ENV !== 'production') response.debugToken = raw;
    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) throw new UnauthorizedException('Reset token is invalid or expired.');
    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new UnauthorizedException('New password must be different from the current password.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is not active.');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.audit.record({ schoolId: user.schoolId, userId, action: 'CHANGE_PASSWORD', entity: 'User', entityId: userId });
    return { message: 'Password changed successfully.' };
  }

  // Creates a new School plus its first SCHOOL_ADMIN user in one transaction,
  // so a school never exists without at least one admin who can log in.
  async registerSchool(dto: RegisterSchoolDto) {
    const existingSlug = await this.prisma.school.findUnique({ where: { slug: dto.schoolSlug } });
    if (existingSlug) {
      throw new ConflictException('A school with this slug already exists.');
    }
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, SALT_ROUNDS);

    const { school, admin } = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name: dto.schoolName, slug: dto.schoolSlug },
      });
      const admin = await tx.user.create({
        data: {
          schoolId: school.id,
          email: dto.adminEmail,
          passwordHash,
          role: Role.SCHOOL_ADMIN,
          name: dto.adminName,
        },
      });
      return { school, admin };
    });

    return this.buildAuthResponse(admin.id, admin.email, admin.role, school.id, admin.name);
  }

  private async buildAuthResponse(
    userId: string,
    email: string,
    role: Role,
    schoolId: string | null,
    name: string | null,
  ) {
    const accessToken = await this.jwt.signAsync({ sub: userId });
    return {
      accessToken,
      user: { id: userId, email, role, schoolId, name },
    };
  }
}
