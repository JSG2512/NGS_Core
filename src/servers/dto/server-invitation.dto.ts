import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  isBoolean,
} from 'class-validator';

export class ServerInvitationDto {
  @IsNumber()
  @IsOptional()
  @Transform((val) => BigInt(val.value))
  invitee?: bigint;

  @IsNumber()
  @Transform((val) => BigInt(val.value))
  serverId: bigint;
}
