import { Global, Module } from '@nestjs/common';
import { KafkaModule } from './kafka/kafka.module';
import { RedisModule } from './redis/redis.module';
import { TokenService } from './token/token.service';
import { PrismaModule } from './prisma/prisma.module';
import { NGSLogger } from './logger/ngs-logger.service';

@Global()
@Module({
  imports: [KafkaModule, RedisModule, PrismaModule],
  controllers: [],
  providers: [TokenService, NGSLogger],
  exports: [KafkaModule, RedisModule, TokenService, PrismaModule, NGSLogger],
})
export class GlobalModule {}
