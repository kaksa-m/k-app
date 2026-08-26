import { Module } from '@nestjs/common';
import { ClassworkService } from './classwork.service';
import { ClassworkController } from './classwork.controller';

@Module({
  providers: [ClassworkService],
  controllers: [ClassworkController],
})
export class ClassworkModule {}
