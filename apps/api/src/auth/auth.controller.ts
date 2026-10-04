import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) { return this.authService.requestPasswordReset(dto); }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) { return this.authService.resetPassword(dto); }

  @Post('change-password')
  changePassword(@CurrentUser() user: { userId: string }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.userId, dto);
  }

  // Self-serve school onboarding. In production you'll likely gate this
  // behind an invite code or a Kaksam-staff-only flow — left open here
  // so the MVP loop (School Setup → ...) is testable end to end.
  @Public()
  @Post('register-school')
  registerSchool(@Body() dto: RegisterSchoolDto) {
    return this.authService.registerSchool(dto);
  }
}
