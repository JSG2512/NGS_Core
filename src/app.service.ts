import { Injectable } from '@nestjs/common';
import { RedisService } from './global/redis/redis.service';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}
  async getHello(): Promise<any> {
    const redis = await this.redisService.getRedisClient();
    const messageId = await redis.xAdd(`ngs_channel_user_${1}`, '*', {
      test: 'test',
    });
  }
}
