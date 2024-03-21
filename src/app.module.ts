import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/const/path.const';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './users/guard/roles.guard';
import { LogMiddleware } from './common/middleware/log.middleware';
import { FileUploadsModule } from './file-uploads/file-uploads.module';
import { ServersModule } from './servers/servers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventModule } from './event/event.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GlobalModule } from './global/global.module';
import { SSEModule } from './sse/sse.module';
import { JWTGuard } from './common/guard/jwt.guard';
import { MessageModule } from './message/message.module';
import { ChannelModule } from './channel/channel.module';
import { DirectMessageModule } from './direct-message/direct-message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    GlobalModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    MessageModule, // channel 보다 위
    ChannelModule, //server 보다 위
    DirectMessageModule, //users 보다 위에 있어야함
    UsersModule,
    CommonModule,
    ServeStaticModule.forRoot({
      rootPath: PUBLIC_FOLDER_PATH,
      serveRoot: '/public',
    }),
    FileUploadsModule,
    ServersModule,
    EventModule,
    SSEModule,
    // MessageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JWTGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
