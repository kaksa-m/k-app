import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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

    return this.buildAuthResponse(user.id, user.email, user.role, user.schoolId, user.name);
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
