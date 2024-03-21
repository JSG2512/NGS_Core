import { Controller, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventService } from './event.service';
import { Interval } from '@nestjs/schedule';
import { UserNotificationEventThrottle } from './types';
import { channel_message } from '@prisma/client';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @OnEvent('user.chat.message.created', { async: true })
  async handleUserChatMessageCreated(payload: channel_message) {
    console.log('트리거됨');
    this.eventService.handleUserChatMessageCreated(payload);
  }

  @OnEvent('user.notification.event.throttle', { async: true })
  async handleUserNotificationEventThrottle(
    payload: UserNotificationEventThrottle,
  ) {
    this.eventService.handleUserNotificationEventThrottle(payload);
  }

  @Interval(500)
  async userNotificationEmit(): Promise<void> {
    console.log('cron');
    // this.eventService.
  }
}
