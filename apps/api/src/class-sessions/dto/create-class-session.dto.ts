import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm"

export class CreateClassSessionDto {
  @IsString()
  sectionId!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  teacherId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Monday ... 6 = Sunday

  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  room?: string;
}
