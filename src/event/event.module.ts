import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { RedisModule } from 'src/global/redis/redis.module';
import { EventController } from './event.controller';
import { MessageService } from 'src/message/message.service';
import { MessageModule } from 'src/message/message.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [RedisModule, ChannelModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
