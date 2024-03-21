import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';
import { IsOptional, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class UpdateChannelDto extends PartialType(CreateChannelDto) {
  @IsString({ message: stringValidationMessage })
  @IsOptional()
  name?: string;

  @IsString({ message: stringValidationMessage })
  @IsOptional()
  type?: string;
}
