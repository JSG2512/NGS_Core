import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  private redisConfig = {
    url: 'redis://dev.dahyeon.us:6379',
    username: process.env.REDIS_USERNAME || 'dahyeon',
    password: process.env.REDIS_PASSWORD || 'ekgusekgusekgus',
  };

  private client = createClient(this.redisConfig).on('error', (err) => {
    console.log(err);
  });

  public async onModuleInit() {
    await this.client.connect();
  }

  public async onModuleDestroy() {
    const [ping, quit] = await Promise.all([
      this.client.ping(),
      // this.client.get('key'),
      this.client.quit(),
    ]); // ['PONG', null, 'OK']

    // await this.client.disconnect();
  }

  public getRedisClient() {
    if (!this.client.isOpen) {
      // this.onModuleInit();
      console.log(!this.client.isOpen);
    }
    return this.client;
  }
}
