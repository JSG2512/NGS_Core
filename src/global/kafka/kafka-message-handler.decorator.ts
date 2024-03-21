import { SetMetadata } from '@nestjs/common';

export const KAFKA_MESSAGE_HANDLER_METADATA = 'kafka_message_handler';
export const KafkaMessageHandler = (topic: string) =>
  SetMetadata(KAFKA_MESSAGE_HANDLER_METADATA, topic);
