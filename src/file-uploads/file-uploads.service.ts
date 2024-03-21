import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class FileUploadsService {
  constructor(private readonly configService: ConfigService) {}

  private readonly credentials: AwsCredentialIdentity = {
    accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
  };
  private readonly s3: S3Client = new S3Client({
    credentials: this.credentials,
    region: this.configService.get('AWS_REGION'),
  });

  async uploadFile(files: Express.Multer.File[]) {
    const commands = files.map((file) => {
      return this.s3.send(
        new PutObjectCommand({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: file.originalname,
          Body: file.buffer,
        }),
      );
    });

    const response = await Promise.all(commands);

    if (response.length !== files.length) {
      throw new InternalServerErrorException("Some files couldn't be uploaded");
    }
  }
}
