import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
// import { user } from '@prisma/client';

export const ExtractUserIdFromToken = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const userId = req.userId;

    // if (!user) {
    //   throw new InternalServerErrorException(
    //     'User 데코레이터는 AccessTokenGuard와 함께 사용해야 합니다. Request에 user 프로퍼티가 존재하지 않습니다.',
    //   );
    // }

    // if (data) {
    //   return user[data];
    // }

    return userId as bigint;
  },
);
