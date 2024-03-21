import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { RedisService } from 'src/global/redis/redis.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class DirectMessageService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  private readonly redis = this.redisService.getRedisClient();
  private readonly prisma = this.prismaService.getInstance();

  public find(userId: bigint) {
    return this.prisma.direct_message.findMany({
      where: {
        sender_user_id: userId,
      },
    });
  }

  public send(userId: bigint, sendMessageDto: SendMessageDto) {
    return this.prisma.direct_message.create({
      data: {
        text: sendMessageDto.text,
        attachments: sendMessageDto.attachment ?? null,
        sender_user_id: userId,
        recipient_user_id: sendMessageDto.recipient_user,
      },
    });
  }

  public modify(
    userId: bigint,
    messageId: bigint,
    updateMessageDto: UpdateMessageDto,
  ) {
    return this.prisma.direct_message.update({
      where: {
        sender_user_id: userId,
        id: messageId,
      },
      data: {
        text: updateMessageDto.text ?? null,
        attachments: updateMessageDto.attachment ?? null,
      },
    });
  }

  public delete(userId: bigint, messageId: bigint) {
    return this.prisma.direct_message.delete({
      where: {
        id: messageId,
        sender_user_id: userId,
      },
    });
  }
}
