import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import * as jose from 'jose';
import { ServerInvitationDto } from './dto/server-invitation.dto';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class ServersService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly prismaClient = this.prismaService.getInstance();

  private readonly SERVER_TOKEN_KEY = new TextEncoder().encode(
    process.env.SERVER_TOKEN_KEY || 'defaultkeyforngs',
  );

  private async generateServerToken(userId: bigint | null, serverId: bigint) {
    const token = await new jose.SignJWT({ serverId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('ngs.co.kr')
      .setAudience(userId.toString())
      .setExpirationTime('24h')
      .sign(this.SERVER_TOKEN_KEY);

    return token;
  }

  async generateInviteLink(
    ownerId: bigint,
    serverInvitationDto: ServerInvitationDto,
  ) {
    const server = await this.prismaClient.server.findUnique({
      where: {
        id: serverInvitationDto.serverId,
        owner_user_id: ownerId,
      },
    });

    if (!server) throw new NotAcceptableException('서버를 찾을 수 없습니다.');
    const token = await this.generateServerToken(
      serverInvitationDto.invitee || null,
      serverInvitationDto.serverId,
    );
    return `~ngs.co.kr/`;
  }

  async joinServer(userId: bigint, serverId: bigint, token?: string) {
    console.log(userId, serverId, token);
    try {
      const server = await this.prismaClient.server.findUnique({
        where: { id: serverId },
      });

      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });

      if (server && user) {
        //Public Access가 가능한 서버인지 검증
        const publicAccessAllowed = server.public_access_allowed;
        if (!publicAccessAllowed) {
          //issuer와 audience는 jwt의 사전 정의된 claim 중 하나이다. (공식 사양), payload는 개발자 정의 claim
          const jwtVerifyResult = await jose.jwtVerify(
            token,
            this.SERVER_TOKEN_KEY,
            {
              issuer: 'ngs.co.kr',
              audience: userId.toString(),
            },
          );
          //payload가 생성되지 않거나 => 토큰 검증 실패
          //token에 기록된 serverId가 참여하고자 하는 서버 Id와 다른 경우
          if (
            !jwtVerifyResult.payload ||
            jwtVerifyResult.payload.serverId !== serverId
          ) {
            throw new UnauthorizedException('Invalid token error');
          }
        }

        const result = await this.prismaClient.server.update({
          where: { id: serverId },
          data: {
            user: {
              connect: {
                id: userId,
              },
            },
          },
        });

        return {
          success: true,
          message: '성공적으로 서버에 참여하였습니다.',
        };
      } else {
        throw new NotFoundException('서버 혹은 유저를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.log(error);
      // if(error instanceof  {
      //   throw new BadRequestException('유저가 이미 해당 서버에 존재합니다.');
      // }
      throw new InternalServerErrorException(
        '해당 서버에 참여하는 중에 에러가 발생하였습니다.',
      );
    }
  }

  // cascade?
  async deleteServerUser(id: bigint, serverId: bigint, targetUserId?: bigint) {
    try {
      await this.prismaClient.server_users.delete({
        where: {
          server_id_user_id: {
            server_id: serverId,
            user_id: targetUserId,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        '서버를 나가는 동안 에러가 발생하였습니다.',
      );
    }
  }

  // 트랜잭션?
  async getServers(query?: string) {
    try {
      if (query) {
        const servers = await this.prismaClient.server.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: query,
                },
              },
              {
                description: {
                  contains: query,
                },
              },
            ],
          },
        });

        return servers;
      } else {
        const servers = await this.prismaClient.server.findMany();
        return servers;
      }
    } catch (error) {
      throw new Error('서버를 가져오는 것을 실패했습니다.');
    }
  }

  async getServerById(id: bigint) {
    const server = await this.prismaClient.server.findUnique({
      where: { id },

      include: {
        server_channels: true,
      },
    });

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  async createServer(ownerId: bigint, createServerDto: CreateServerDto) {
    const { publicAccessAllowed, ...serverProperties } = createServerDto;
    const server = await this.prismaClient.server.create({
      data: {
        id: 2,
        owner_user_id: ownerId,
        public_access_allowed: createServerDto.publicAccessAllowed,
        description: createServerDto.description,
        name: createServerDto.serverName,
        profile_image_url: createServerDto.profileImageUrl,
      },
    });

    return server;
  }

  async updateServer(
    userId: bigint,
    serverId: bigint,
    serverDto: UpdateServerDto,
  ) {
    try {
      const server = await this.prismaClient.server.findUnique({
        where: { id: serverId },
        include: {
          server_users: {
            where: { user_id: userId },
          },
        },
      });
      if (!server) {
        throw new NotFoundException('서버를 찾을 수 없습니다.');
      }

      const newServer = await this.prismaClient.server.update({
        where: {
          id: serverId,
        },
        data: {
          name: serverDto.serverName ?? undefined,
          description: serverDto.description ?? undefined,
          profile_image_url: serverDto.profileImageUrl ?? undefined,
        },
      });

      return newServer;
    } catch (error) {
      throw new InternalServerErrorException(
        '채널을 수정하는 동안 에러가 발생하였습니다.',
      );
    }
  }

  // cascade?
  public async deleteServer(userId: bigint, serverId: bigint) {
    try {
      await this.prismaClient.server.delete({
        where: { id: serverId, owner_user_id: userId },
      });
      return {
        success: true,
        message: '성공적으로 서버를 삭제하였습니다.',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        '서버를 삭제하는 동안 에러가 발생하였습니다.',
      );
    }
  }

  // public async deleteServerUser(userId: bigint, serverId: bigint) {
  //   try {
  //     await this.prismaClient.server_users.deleteMany({
  //       where: { server_id: serverId, user_id: userId },
  //     });
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       '서버를 나가는 동안 에러가 발생하였습니다.',
  //     );
  //   }
  // }
}
