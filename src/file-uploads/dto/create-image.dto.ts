import { PickType } from '@nestjs/mapped-types';

export class CreatePostImageDto {
  path: string;
  order: number;
  type: string;
}
