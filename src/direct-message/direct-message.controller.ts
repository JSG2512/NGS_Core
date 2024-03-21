import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { ExtractUserIdFromToken } from 'src/common/decorator/extract-userid-from-token.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('/user/message')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @Get()
  public find(@ExtractUserIdFromToken() userId: bigint) {
    return this.directMessageService.find(userId);
  }

  @Put()
  public send(
    @ExtractUserIdFromToken() userId: bigint,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.directMessageService.send(userId, sendMessageDto);
  }

  @Put(':messageId')
  public modify(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('messageId') messageId: bigint,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.directMessageService.modify(
      userId,
      messageId,
      updateMessageDto,
    );
  }

  @Delete(':messageId')
  public delete(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('messageId') messageId: bigint,
  ) {
    return this.directMessageService.delete(userId, messageId);
  }
}
