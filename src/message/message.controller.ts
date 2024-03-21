import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ExtractUserIdFromToken } from 'src/common/decorator/extract-userid-from-token.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('message')
@Controller('/server/:serverId/:channelId/')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({ summary: '메시지 생성' })
  @Post('message')
  create(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('channelId') channelId: bigint,
    @Param('serverId') serverId: bigint,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messageService.create(userId, channelId, createMessageDto);
  }

  @ApiOperation({ summary: '메시지 조회' })
  @Get('message')
  find(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('channelId') channelId: bigint,
    @Param('serverId') serverId: bigint,
  ) {
    return this.messageService.find(userId, channelId);
  }

  @ApiOperation({ summary: '메시지 수정' })
  @Patch(':message-id')
  update(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('message-id') messageId: bigint,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.update(userId, messageId, updateMessageDto);
  }

  @ApiOperation({ summary: '메시지 삭제' })
  @Delete(':message-id')
  remove(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('message-id') messageId: bigint,
  ) {
    return this.messageService.remove(userId, messageId);
  }
}
