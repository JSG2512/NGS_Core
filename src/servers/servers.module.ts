import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { UsersModule } from 'src/users/users.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [UsersModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
