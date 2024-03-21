import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class PutFriendDto {
  @IsNotEmpty()
  @IsString()
  isAccepted: 'request' | 'accept';
}
