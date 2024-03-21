import { Transform } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  @Transform((val) => BigInt(val.value))
  recipient_user: bigint;

  @IsString()
  text: string;

  @IsArray()
  @IsOptional()
  attachment: string[];

  @IsEnum(['amazon-s3'])
  @IsOptional()
  attachment_provider: 'amazon-s3';
}
