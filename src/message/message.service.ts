import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageService {
  constructor(
    private readonly prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  public async create(
    userId: bigint,
    channelId: bigint,
    createMessageDto: CreateMessageDto,
  ) {
    const prisma = this.prismaService.getInstance();
    /**
     * 메시지 보낼 때, 채널이 속한 서버에 유저가 속해있는지 확인
     * ERD를 보면 channel_message는 channel과 1:N 관계이고, channel은 server_channel과 N:1 관계이고, server_channel은 server와 N:1 관계이고, server는 server_user와 1:N 관계이다.
     * 메시지를 생성하고, 메시지를 받는 사용자에게 SSE 이벤트를 전송한다.
     */
    const message = await prisma.channel_message.create({
      data: {
        text: createMessageDto.text,
        attachments: createMessageDto.attachment,
        user_id: userId,
        channel_id: channelId,
      },
      include: {
        channel: {
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
        },
      },
    });
    this.eventEmitter.emit('user.chat.message.created', message);

    if (!message)
      throw new InternalServerErrorException(
        'Somthing went wrong While creating message',
      );

    return {
      message: 'success',
      data: message,
    };
  }

  public async find(
    userId: bigint,
    channelId: bigint,
    offset?: number,
    limit?: number,
  ) {
    const prisma = this.prismaService.getInstance();
    const messages = await prisma.channel_message.findMany({
      where: {
        channel_id: channelId,
      },
      include: {
        channel: {
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
        },
      },
      skip: offset ?? 0,
      take: limit ?? 30,
    });
    if (!messages)
      throw new InternalServerErrorException(
        'Somthing went wrong While fetching messages',
      );
    return {
      message: 'success',
      data: messages,
    };
  }

  public async update(
    userId: bigint,
    messageId: bigint,
    updateMessageDto: UpdateMessageDto,
  ) {
    const prisma = this.prismaService.getInstance();
    const message = await prisma.channel_message.update({
      where: {
        id: messageId,
        user_id: userId,
      },
      data: {
        text: updateMessageDto.text,
        attachments: updateMessageDto.attachment,
      },
    });
    if (!message)
      throw new InternalServerErrorException(
        'Somthing went wrong While updating message',
      );
    return {
      message: 'success',
      data: message,
    };
  }

  public async remove(userId: bigint, messageId: bigint) {
    const prisma = this.prismaService.getInstance();
    const message = await prisma.channel_message.delete({
      where: {
        id: messageId,
        user_id: userId,
      },
    });
    if (!message)
      throw new InternalServerErrorException(
        'Somthing went wrong While deleting message',
      );
    return {
      message: 'success',
      data: message,
    };
  }
}
