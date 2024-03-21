import { PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  nickname: string;

  @IsString()
  email: string;

  @IsString()
  password: string;
}
