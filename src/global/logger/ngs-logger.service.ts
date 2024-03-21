import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class NGSLogger {
  private logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  public log(message: string, level: string = 'info') {
    switch (level) {
      case 'info':
        this.logger.info(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      case 'error':
        this.logger.error(message);
        break;
      default:
        this.logger.info(message);
        break;
    }
  }
}
