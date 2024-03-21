import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { RedisService } from 'src/global/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChannelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  private readonly redis = this.redisService.getRedisClient();
  private readonly prisma = this.prismaService.getInstance();

  async createChannel(
    userId: bigint,
    serverId: bigint,
    createChannelDto: CreateChannelDto,
  ) {
    try {
      const server = this.prisma.server.findUnique({
        where: { id: serverId },
        include: {
          server_users: {
            where: { user_id: userId },
          },
          server_channels: {
            include: {
              channel: true,
            },
          },
        },
      });

      // await this.serversRepository.findOne({
      //   where: { id: serverId },
      //   relations: ['users'],
      // });

      if (!server) {
        throw new NotFoundException('서버를 찾을 수 없습니다.');
      }

      // const isUserInServer = server.users.some((user) => user.id === userId);

      // if (!isUserInServer) {
      //   throw new UnauthorizedException(
      //     '해당 유저는 서버에 속해있지 않습니다.',
      //   );
      // }

      const channel = await this.prisma.channel.create({
        data: {
          name: createChannelDto.name,
          type: createChannelDto.type,
          owner_user_id: userId,
          server_channels: {
            create: {
              server_id: serverId,
            },
          },
        },
      });

      return channel;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '채널을 생성하는 동안 에러가 발생하였습니다.',
      );
    }
  }

  async deleteChannel(userId: bigint, serverId: bigint, channelId: bigint) {
    try {
      const server = await this.prisma.server.findUnique({
        where: { id: serverId },
        include: {
          server_users: {
            where: { user_id: userId },
          },
          server_channels: {
            include: {
              channel: true,
            },
          },
        },
      });

      if (!server) {
        throw new NotFoundException('서버를 찾을 수 없습니다.');
      }

      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId, owner_user_id: userId },
      });

      if (!channel) {
        throw new NotFoundException('채널을 찾을 수 없거나 권한이 없습니다.');
      }

      await this.prisma.channel.delete({
        where: { id: channelId },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        '채널을 삭제하는 동안 에러가 발생하였습니다.',
      );
    }
  }

  async updateChannel(
    userId: bigint,
    serverId: bigint,
    channelId: bigint,
    updateChannelDto: UpdateChannelDto,
  ) {
    try {
      await this.prisma.channel.update({
        where: {
          id: channelId,
          owner_user_id: userId,
        },
        include: {
          server_channels: {
            where: {
              server_id: serverId,
            },
          },
        },
        data: {
          name: updateChannelDto.name ?? undefined,
          type: updateChannelDto.type ?? undefined,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          '쿼리 엔진이 요청과 관련된 알려진 오류가 발생했습니다.',
        );
      }
      throw new BadRequestException(
        '채널을 수정하는 동안 에러가 발생하였습니다. 사용자는 권한이 없거나 잘못된 요청을 보냈습니다.',
      );
    }
  }

  async getChannels(userId: bigint, serverId: bigint) {
    try {
      const channels = await this.prisma.channel.findMany({
        include: {
          server_channels: {
            include: {
              server: {
                include: {
                  server_users: {
                    where: {
                      user_id: userId,
                    },
                  },
                },
              },
            },
            where: {
              server: {
                id: serverId,
              },
            },
          },
        },
      });

      if (!channels) {
        throw new NotFoundException(
          '서버를 찾을 수 없습니다. 해당 유저는 서버에 속해있지 않습니다.',
        );
      }

      return {
        message: 'success',
        data: {
          channels: channels,
        },
      };
    } catch (error) {
      throw new Error('채널들을 가져오는 것을 실패했습니다.');
    }
  }

  async addMember(userId: bigint, channelId: bigint) {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          server_channels: {
            include: {
              server: {
                include: {
                  server_users: {
                    where: {
                      user_id: userId,
                    },
                  },
                },
              },
            },
          },
        },
      });
      // Redis를 사용하여 채팅방에 유저 추가
      // 여기서 'channelParticipants:{channelId}'는 채널별 참여자 목록을 나타내는 Redis key입니다.
      await this.redis.sAdd(`channel_member:${channelId}`, userId.toString());
      this.eventEmitter.emit('joinChannel', {});
      return {
        messagee: 'success',
        data: {
          channel: channel,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        '채널에 참여하는 동안 에러가 발생하였습니다.',
      );
    }
  }

  async removeMember(userId: bigint, channelId: bigint) {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          server_channels: {
            include: {
              server: {
                include: {
                  server_users: {
                    where: {
                      user_id: userId,
                    },
                  },
                },
              },
            },
          },
        },
      });
      // Redis에서 해당 유저를 채널 참여자 목록에서 제거
      await this.redis.sRem(`channel_member:${channelId}`, userId.toString());
      return {
        messagee: 'success',
        data: {
          channel: channel,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        '채널에서 나가는 동안 에러가 발생하였습니다.',
      );
    }
  }

  async getMembers(channelId: bigint) {
    const redis = this.redisService.getRedisClient();

    // Redis에서 해당 채널의 참여자 목록을 가져옴
    const participants = await redis.sMembers(
      `channel_member:${channelId.toString()}`,
    );

    return {
      message: 'success',
      data: {
        participants: participants.map((id) => BigInt(id)),
      },
    };
  }
}
