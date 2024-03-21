import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  ValidateNested,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateMessageDto {
  // @IsNumber()
  // @Transform((val) => BigInt(val.value))
  // channelId: bigint;

  @IsString()
  text: string;

  @IsArray()
  @IsOptional()
  attachment: string[];

  @IsEnum(['amazon-s3'])
  @IsOptional()
  attachment_provider: 'amazon-s3';
}
