import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { fromEvent } from 'rxjs';
import { RedisService } from 'src/global/redis/redis.service';
import { UserNotificationEventThrottle } from './types';
import { UserNotificationEvent } from 'src/types';
import { channel_message } from '@prisma/client';
import { MessageService } from 'src/message/message.service';
import { ChannelService } from 'src/channel/channel.service';

@Injectable()
export class EventService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly chanelService: ChannelService,
  ) {}
  private readonly redis = this.redisService.getRedisClient();

  throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return fn(...args);
    };
  }

  @Interval(500)
  async userNotificationEmit(): Promise<void> {
    // console.log('cron');
    // const events = await this.redisService.getUserNotificationEvent();
    // console.log(events, '123123');
    //event emit
    /*
    SSE로 1초간 스로틀링된 메시지를 전송합니다.
    */
    //this.sseService.sendEventToUser(event.userId, event);
  }

  async sendChatMessage(userId: number, event: UserNotificationEvent) {
    const source = fromEvent(this.eventEmitter, 'userChatMessage');
    return source.pipe().subscribe((data) => {
      console.log(data, 'testtest');
    });
  }

  private async addMessageToStream(
    streamKey: string,
    message: Record<string, string>,
  ): Promise<string> {
    const redis = this.redisService.getRedisClient();
    const messageId = await redis.xAdd(
      `ngs_channel_user_${streamKey}`,
      '*',
      message,
    );
    return messageId;
  }

  public async handleUserChatMessageCreated(payload: channel_message) {
    const userIds = await this.chanelService.getMembers(payload.channel_id);
    const result = await Promise.all(
      userIds.data.participants.map(async (userId) => {
        return await this.addMessageToStream(userId.toString(), {
          type: 'chat',
          message: JSON.stringify(payload),
        });
      }),
    );
    return result;
  }

  public handleUserNotificationEventThrottle(
    payload: UserNotificationEventThrottle,
  ) {
    const redis = this.redisService.getRedisClient();
    const streamKey = `userStream:${payload.streamName}`;
    redis.xAdd(streamKey, '*', payload);
  }
}
