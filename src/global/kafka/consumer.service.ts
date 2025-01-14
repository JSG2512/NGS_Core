import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaMessage, EachBatchHandler, EachBatchPayload } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { KAFKA_MESSAGE_HANDLER_METADATA } from './kafka-message-handler.decorator';

@Injectable()
export class ConsumerService implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  private readonly topicList: string[] = ['queuing.ngs.event'];

  private async consumeAndEmit() {
    //2회 재시도를 위해 카운터 설정
    let retryCounter = 0;

    await this.kafkaService.consumer.run({
      autoCommit: false,
      eachBatchAutoResolve: false,
      eachBatch: async (payload: EachBatchPayload) => {
        const messages = payload.batch.messages;
        const topic = payload.batch.topic;
        const partition = payload.batch.partition;

        const firstOffset = payload.batch.firstOffset();
        const lastOffset = payload.batch.lastOffset();

        console.log(firstOffset, 'firstOffset');
        console.log(lastOffset, 'lastOffset');

        for (let message of messages) {
          if (!payload.isRunning() || payload.isStale()) break;
          try {
            /* 메시지 처리 핸들러 시작 */
            await this.messageHandler(message);
            /* 메시지 처리 핸들러 끝 */

            /* Kafka 오프셋 커밋 프로세스 시작 */
            console.log(
              `토픽 : ${topic}, 파티션 : ${partition}, 오프셋 : ${message.offset} 를 커밋합니다.`,
            );

            //처리에 성공할 경우 수동으로 커밋한다.
            payload.resolveOffset(message.offset); //현재 오프셋의 소비 프로세스가 성공했음을 알린다.
            await payload.commitOffsetsIfNecessary(
              this.generateOffsetConfig(topic, partition, message),
            ); //오프셋을 커밋한다.

            /* Kafka 오프셋 커밋 프로세스 끝 */
          } catch (error) {
            //재시도 카운터를 증가시킨다.
            retryCounter++;
            console.log('retryCounter : ', retryCounter);

            /* Kafka 오프셋 커밋 및 로그 전송 프로세스 시작 */
            //재시도 카운터가 2인 경우 에러가 발생하더라도 오프셋을 리졸브하고 커밋한다.
            if (retryCounter >= 2) {
              console.log(
                '재시도 카운터가 2인 경우 에러가 발생하더라도 오프셋을 리졸브하고 커밋한다.',
              );

              payload.resolveOffset(message.offset); //현재 오프셋의 소비 프로세스가 성공했음을 전달한다.
              await payload.commitOffsetsIfNecessary(
                this.generateOffsetConfig(topic, partition, message),
              ); //오프셋을 커밋한다.
              retryCounter = 0; // 재시도 카운터 초기화

              console.error(error, '@@@에러@@@');
            }
            /* Kafka 오프셋 커밋 및 로그 전송 프로세스 끝 */
            console.error(error, '@@@에러@@@');
          } finally {
            /* 하트 비트 전송(컨슈머 헬스체크) 시작 */
            await payload.heartbeat();
            /* 하트 비트 전송(컨슈머 헬스체크) 끝 */
            //의도적으로 메시지 소비를 지연시킴.
            await this.delay(1000);
          }
        }
      },
    });
  }
  public async commitOffset(topic: string, partition: number, offset: string) {
    console.log('커밋된 오프셋 :', (parseInt(offset) + 1).toString());
    await this.kafkaService.consumer.commitOffsets([
      {
        topic: topic,
        partition: partition,
        offset: (parseInt(offset) + 1).toString(),
      },
    ]);
  }

  private generateOffsetConfig(
    topic: string,
    partition: number,
    message: KafkaMessage,
  ) {
    return {
      topics: [
        {
          topic: topic,
          partitions: [
            {
              partition: partition,
              offset: (parseInt(message.offset) + 1).toString(), //클라이언트 재시작 시 동일한 메시지가 다시 소비되지 않도록 현재 오프셋 + 1 을 커밋한다.
            },
          ],
        },
      ],
    };
  }

  private async messageHandler(message: KafkaMessage): Promise<void> {
    if (!message.key || !message.value)
      throw new Error('메시지 키 혹은 값이 존재하지 않습니다.');

    const key = message.key.toString('utf-8');
    const payload: any = this.bufferToPlainObject(message.value);

    try {
      //이벤트 거르는 체
      //case를 통해 특별히 처리할 이벤트를 추가하고 나머지는 논블로킹으로 처리한다.
      switch (key) {
        case '특별하게 먼저 처리할 이벤트':
          break;

        default:
          const handlers = this.findHandlersForKey(key);
          // 성능을 위해 논블로킹
          Promise.all(handlers.map((handler) => handler(payload))).catch(
            (error) => {
              console.error(`Error processing message from key ${key}:`, error);
              // 여기에 추가적인 에러 처리 로직을 구현할 수 있습니다.
            },
          );
          // this.eventEmitter.emit(key, payload);
          break;
      }
    } catch (error) {
      // 이벤트 처리 중 에러가 발생하면 에러를 던진다.
      // 에러를 발생시키면 consumeAndEmit 메서드에서 consume 하고 있는 partition의 offset을 커밋하지 않기 떄문에 다음번에 다시 메시지를 소비할 수 있다.
      throw new Error('some error occurred while consuming kafka message');
    }
  }

  private delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private instanceWrappers: InstanceWrapper[];

  private explore() {
    // container에 있는 모든 instance를 가져옵니다.
    this.instanceWrappers = [
      ...this.discoveryService.getControllers(),
      // ...this.discoveryService.getProviders(),
    ];
  }

  private findHandlersForKey(key: string): Function[] {
    const handlers: Function[] = [];

    /* 인스턴스화된 컨트롤러 목록 */
    this.instanceWrappers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        if (!instance || !Object.getPrototypeOf(instance)) {
          return;
        }

        const methodNames = this.metadataScanner.getAllMethodNames(
          Object.getPrototypeOf(instance),
        );
        methodNames.forEach((methodName) => {
          const method = instance[methodName];
          const methodTopic = Reflect.getMetadata(
            KAFKA_MESSAGE_HANDLER_METADATA,
            method,
          );

          if (methodTopic === key) {
            handlers.push(method.bind(instance));
          }
        });
      });

    return handlers;
  }

  async onModuleInit() {
    this.explore();
    try {
      await this.kafkaService.consumer.subscribe({
        topics: [...this.topicList],
        fromBeginning: false,
      });
      console.log('모듈이 로드됨');
      await this.consumeAndEmit();
    } catch (error) {}
  }

  public bufferToPlainObject(payload: Buffer): any {
    const buffer = Buffer.from(payload);
    const string = buffer.toString();

    try {
      const object = JSON.parse(string);

      if (typeof object !== 'object') {
        throw new Error('버퍼를 파싱하는 중 에러가 발생하였습니다.');
      }

      return object;
    } catch (error) {
      throw new Error('JSON 형식이 아닙니다.');
    }
  }
}
