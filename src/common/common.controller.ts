import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CommonService } from './common.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}
}
