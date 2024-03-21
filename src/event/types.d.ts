import { channel_message } from '@prisma/client';

// export type UserChatMessage = {
//   userId: string;
//   channelId: string;
//   data: channel_message;
// };

export type UserNotificationEventThrottle = {
  streamName: string;
  type: 'chat' | 'notification';
  data: string;
};
