import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsString, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

class StudentAttendanceEntry {
  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

// The teacher's one-tap "take attendance" screen posts the whole class
// roster at once rather than one row per request.
export class MarkAttendanceDto {
  @IsString()
  classSessionId!: string;

  @IsDateString()
  date!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceEntry)
  entries!: StudentAttendanceEntry[];
}
