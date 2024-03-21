import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';
import * as jose from 'jose';
import { JWTExpired } from 'jose/dist/types/util/errors';

export type JWTPayload = {
  userId: bigint;
};

export type TokenVerificationResult = {
  status: 'granted' | 'expired' | 'denied';
  payload?: JWTPayload;
};

@Injectable()
export class TokenService {
  constructor(private readonly configService: ConfigService) {}
  private readonly alg = 'HS256';

  public async generateToken(
    payload: JWTPayload,
    expiresIn: '30m' | '1d' | '7d' | '30d',
  ) {
    const HS256Secret = new TextEncoder().encode(
      this.configService.get<string>('JWT_HS256_SECRET'),
    );
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.alg })
      .setIssuedAt(Date.now())
      .setIssuer(this.configService.get<string>('SERVICE_NAME'))
      .setExpirationTime(expiresIn)
      .sign(HS256Secret);
  }

  public async verifyAccessToken(
    req: Request,
  ): Promise<TokenVerificationResult> {
    const HS256Secret = new TextEncoder().encode(
      this.configService.get<string>('JWT_HS256_SECRET'),
    );

    const token = this.tokenParserFromHeaders(req.headers);
    try {
      const accessTokenVerificationResult = await jose.jwtVerify(
        token,
        HS256Secret,
        {
          issuer: this.configService.get<string>('SERVICE_NAME'),
        },
      );
      return {
        status: 'granted',
        payload: accessTokenVerificationResult.payload as JWTPayload,
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return {
          status: 'expired',
        };
      }
      return {
        status: 'denied',
      };
    }
  }

  public async verifyRefreshToken(
    req: Request,
  ): Promise<TokenVerificationResult> {
    const HS256Secret = new TextEncoder().encode(
      this.configService.get<string>('JWT_HS256_SECRET'),
    );

    const refreshToken = req.cookies['refreshToken'];

    try {
      const refreshTokenVerificationResult = await jose.jwtVerify(
        refreshToken,
        HS256Secret,
        {
          issuer: this.configService.get<string>('SERVICE_NAME'),
        },
      );
      return {
        status: 'granted',
        payload: refreshTokenVerificationResult.payload as JWTPayload,
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return {
          status: 'expired',
        };
      }
      return {
        status: 'denied',
      };
    }
  }

  public async verifySingleToken(
    token: string,
  ): Promise<TokenVerificationResult> {
    const HS256Secret = new TextEncoder().encode(
      this.configService.get<string>('JWT_HS256_SECRET'),
    );

    try {
      const accessTokenVerificationResult = await jose.jwtVerify(
        token,
        HS256Secret,
        {
          issuer: this.configService.get<string>('SERVICE_NAME'),
        },
      );
      return {
        status: 'granted',
        payload: accessTokenVerificationResult.payload as JWTPayload,
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return {
          status: 'expired',
        };
      }
      return {
        status: 'denied',
      };
    }
  }

  private tokenParserFromHeaders(headers: IncomingHttpHeaders) {
    const bearerTokenLike = headers['authorization'];

    if (!bearerTokenLike) {
      throw new UnauthorizedException('토큰이 없습니다!');
    }

    if (bearerTokenLike.split(' ')[0] !== 'Bearer') {
      throw new UnauthorizedException('Bearer Token이 아닙니다!');
    }
    return bearerTokenLike.split(' ')[1];
  }
}
