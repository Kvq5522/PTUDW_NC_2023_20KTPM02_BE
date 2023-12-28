import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExcelService } from 'src/excel/excel.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, ExcelService],
})
export class AdminModule {}
