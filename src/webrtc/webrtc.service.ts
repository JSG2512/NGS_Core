import { Injectable } from '@nestjs/common';
import { ProducerService } from 'src/global/kafka/producer.service';
import { NGSLogger } from 'src/global/logger/ngs-logger.service';
import { TokenService } from 'src/global/token/token.service';

@Injectable()
export class WebRtcService {
  constructor(
    private readonly producerService: ProducerService,
    private readonly tokenService: TokenService,
    private readonly ngsLogger: NGSLogger,
  ) {}

  async getWebRtcOffer(payload: object) {
    const { userId, streamId, accssToken, serviceName } = payload as {
      userId: bigint;
      streamId: string;
      accssToken: string;
      serviceName: string;
    };
    try {
      await this.tokenService.verifySingleToken(accssToken);
      await this.producerService.createMessage(
        `queuing.${serviceName}.event`,
        'test',
        {
          message: 'success',
        },
      );
    } catch (error) {
      this.ngsLogger.log(error);
    }
  }

  async getVideoOffer(payload: object) {
    const { userId, streamId, accssToken, serviceName } = payload as {
      userId: bigint;
      streamId: string;
      accssToken: string;
      serviceName: string;
    };
    try {
      await this.tokenService.verifySingleToken(accssToken);
      await this.producerService.createMessage(
        `queuing.${serviceName}.event`,
        'test',
        {
          message: 'success',
        },
      );
    } catch (error) {
      this.ngsLogger.log(error);
    }
  }

  async getAudioOffer(payload: object) {
    const { userId, streamId, accssToken, serviceName } = payload as {
      userId: bigint;
      streamId: string;
      accssToken: string;
      serviceName: string;
    };
    try {
      await this.tokenService.verifySingleToken(accssToken);
      await this.producerService.createMessage(
        `queuing.${serviceName}.event`,
        'test',
        {
          message: 'success',
        },
      );
    } catch (error) {
      this.ngsLogger.log(error);
    }
  }

  async checkCurrentConnection(payload: object) {
    const { streamId, accssToken, serviceName } = payload as {
      streamId: string;
      accssToken: string;
      serviceName: string;
    };
    try {
      await this.tokenService.verifySingleToken(accssToken);
      await this.producerService.createMessage(
        `queuing.${serviceName}.event`,
        'test',
        {},
      );
    } catch (error) {
      this.ngsLogger.log(error);
    }
  }
}
