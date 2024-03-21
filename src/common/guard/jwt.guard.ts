import {
  CanActivate,
  ExecutionContext,
  Injectable,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorator/is-public.decorator';
import { Request, Response } from 'express';
import { JWTPayload, TokenService } from '../../global/token/token.service';
import { Observable } from 'rxjs';

@Injectable()
export class JWTGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & { [x: string]: any } = context
      .switchToHttp()
      .getRequest();

    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      request.isRoutePublic = true;
      return true;
    }
    console.log(request.cookies, 'request.cookies');
    if (
      !Object.prototype.hasOwnProperty.call(request.headers, 'authorization') ||
      !Object.prototype.hasOwnProperty.call(request.cookies, 'refreshToken')
    ) {
      throw new PreconditionFailedException('precondition failed');
    }

    // const response: Response = context.switchToHttp().getResponse();

    const accessTokenVerificationResult =
      await this.tokenService.verifyAccessToken(request);

    if (accessTokenVerificationResult.status === 'granted') {
      request.userId = accessTokenVerificationResult.payload.userId;
      request.isRoutePublic = true;
      return true;
    }

    const refreshTokenVerificationResult =
      await this.tokenService.verifyRefreshToken(request);

    if (refreshTokenVerificationResult.status === 'granted') {
      request.userId = refreshTokenVerificationResult.payload.userId;
      request.isRoutePublic = true;
      return true;
    }

    return true;
  }
}

// @Injectable()
// export class BearerTokenGuard implements CanActivate {
//   constructor(
//     private readonly usersService: UsersService,
//     private readonly reflector: Reflector,
//     private readonly tokenService: TokenService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     const req: Request & { [x: string]: any } = context
//       .switchToHttp()
//       .getRequest();

//     const res: Response = context.switchToHttp().getResponse();

//     if (isPublic) {
//       req.isRoutePublic = true;

//       return true;
//     }

//     const payload = await new Promise<JWTPayload>((resolve, reject) => {
//       this.tokenService
//         .verifyToken(req)
//         .then((payload) => {
//           resolve(payload);
//         })
//         .catch((err) => {
//           reject(err);
//         });
//     }).catch((err) => {
//       console.log(err, 'err');
//     });

//     console.log(payload, 'payload##############################');
//     if (!payload) {
//       return false;
//     }

//     const user = await this.usersService.getUserById(payload && payload.userId);

//     req.user = user;

//     return true;
//   }
// }

// @Injectable()
// export class AccessTokenGuard extends BearerTokenGuard {
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     await super.canActivate(context);

//     const req = context.switchToHttp().getRequest();

//     if (req.isRoutePublic) {
//       return true;
//     }

//     return true;
//   }
// }

// @Injectable()
// export class RefreshTokenGuard extends BearerTokenGuard {
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     await super.canActivate(context);

//     const req = context.switchToHttp().getRequest();

//     if (req.isRoutePublic) {
//       return true;
//     }

//     if (req.tokenType !== 'refresh') {
//       throw new UnauthorizedException('Refresh Token이 아닙니다.');
//     }

//     return true;
//   }
// }
