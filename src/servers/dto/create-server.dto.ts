import { PickType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, isBoolean } from 'class-validator';

export class CreateServerDto {
  @IsString()
  serverName: string;

  @IsString()
  description: string;

  @IsString({ each: true })
  @IsOptional()
  profileImageUrl?: string;

  @IsBoolean()
  publicAccessAllowed: boolean;
}
