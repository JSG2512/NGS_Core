import { Controller, Get, Query, Res, Sse, UseGuards } from '@nestjs/common';
import { SSEService } from './sse.service';
import { Response } from 'express';
import {
  Observable,
  Observer,
  ReplaySubject,
  Subject,
  catchError,
  from,
  mergeMap,
} from 'rxjs';
import { RedisService } from 'src/global/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExtractUserIdFromToken } from '../common/decorator/extract-userid-from-token.decorator';

class User {
  id: bigint;
}

type Stream = {
  userId: bigint;
  subject: Subject<User>;
  observer: Observable<User>;
};

@Controller('sse')
export class SSEController {
  constructor(
    private readonly SSEService: SSEService,
    private readonly redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  private user$ = new Subject<User>();

  private SSE_HEADER = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  private observer = this.user$.asObservable();

  private stream: Stream[] = [];

  private addStream(
    userId: bigint,
    subject: Subject<User>,
    observer: Observable<User>,
  ): void {
    this.stream.push({ userId, subject, observer });
  }

  private async addToStream(userId, eventData) {
    const redis = this.redisService.getRedisClient();
    const streamKey = `userStream:${userId}`;
    await redis.xAdd(streamKey, '*', eventData);
  }

  public listenToStream(streamName: string): Observable<any> {
    const redis = this.redisService.getRedisClient();
    return new Observable((observer) => {
      let lastId = '0';

      const readMessages = () => {
        // xRead를 Promise로 변환한 후 from을 사용하여 Observable로 변환
        const xReadPromise = redis.xRead([
          { key: `ngs_channel_user_${streamName}`, id: lastId },
        ]);

        return from(xReadPromise).pipe(
          mergeMap((stream) => {
            if (stream) {
              const messages = stream[0].messages;
              messages.forEach((message) => {
                console.log(message);
                lastId = message.id;
                observer.next({ id: message.id, message: message['message'] });
              });
            }
            return readMessages();
          }),
          catchError((err) => {
            console.log(err);
            observer.error(err);
            return [];
          }),
        );
      };

      readMessages().subscribe();
    });
  }

  @Sse(':userId')
  addSSEStreanm(
    @ExtractUserIdFromToken('id') userId: bigint,
    @Res() res: Response,
  ): Observable<any> {
    const streamObservable = this.listenToStream(userId.toString());
    streamObservable.subscribe({
      next: (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      error: (error) => {
        console.error(error);
        res.end();
      },
    });
    //nestjs의 sse는 반드시 Observable을 리턴해야함
    return streamObservable;
  }

  async onModuleInit(): Promise<any> {}
}
