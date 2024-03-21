import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadsService } from './file-uploads.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('file-uploads')
export class FileUploadsController {
  constructor(private readonly fileUploadsService: FileUploadsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('file', 10))
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    return this.fileUploadsService.uploadFile(files);
  }
}
