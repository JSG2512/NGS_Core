export interface UserNotificationEvent {
  userId: number;
  message: string;
  type: string;
  data: any;
}
