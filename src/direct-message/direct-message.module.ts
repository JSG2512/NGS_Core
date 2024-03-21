import { Module } from '@nestjs/common';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';

@Module({
  imports: [],
  providers: [DirectMessageService],
  controllers: [DirectMessageController],
})
export class DirectMessageModule {}
