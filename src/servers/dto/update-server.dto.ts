import { PartialType } from "@nestjs/mapped-types";
import { CreateServerDto } from "./create-server.dto";
import { IsOptional, IsString } from "class-validator";
import { stringValidationMessage } from "src/common/validation-message/string-validation.message";

export class UpdateServerDto extends PartialType(CreateServerDto){
  @IsString({
    message: stringValidationMessage
  })
  @IsOptional()
  serverName?: string;

  @IsString({
    message: stringValidationMessage
  })
  @IsOptional()
  description?: string;

  @IsString({
    message: stringValidationMessage
  })
  @IsOptional()
  profileImageUrl?: string;
}