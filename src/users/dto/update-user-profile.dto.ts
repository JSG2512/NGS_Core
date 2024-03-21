import { IsOptional, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class UpdateUserProfileDto {
  @IsString({ message: stringValidationMessage })
  @IsOptional()
  nickname?: string;

  @IsString({ message: stringValidationMessage })
  @IsOptional()
  description?: string;

  @IsString({ message: stringValidationMessage })
  @IsOptional()
  profileImageUrl?: string;
}
