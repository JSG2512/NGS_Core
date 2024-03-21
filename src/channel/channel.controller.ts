import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ExtractUserIdFromToken } from 'src/common/decorator/extract-userid-from-token.decorator';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('channel')
@Controller('server/:serverId/')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @ApiOperation({ summary: '채널 불러오기' })
  @Get('channel')
  getChannels(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
  ) {
    return this.channelService.getChannels(userId, serverId);
  }

  // 채널 불러오기 - 단수
  // @Get(':serverId/channels/:channelId')
  // @UseGuards(AccessTokenGuard)
  // getChannel(){}

  @ApiOperation({ summary: '채널 생성' })
  @Post('channel')
  // @UseGuards(AccessTokenGuard)
  createChannel(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.channelService.createChannel(
      userId,
      serverId,
      createChannelDto,
    );
  }

  @ApiOperation({ summary: '채널 삭제' })
  @Delete(':channelId')
  deleteChannel(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
    @Param('channelId') channelId: bigint,
  ) {
    return this.channelService.deleteChannel(userId, serverId, channelId);
  }

  @ApiOperation({ summary: '채널 수정' })
  @Patch(':channelId')
  updateChannel(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
    @Param('channelId') channelId: bigint,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelService.updateChannel(
      userId,
      serverId,
      channelId,
      updateChannelDto,
    );
  }

  //Put 메서드는 멱등성을 특히 강조하기 위해 설계된 메서드이다. 멱등성이란, 한 번 호출하든 두 번 호출하든 결과가 같은 것을 의미한다.
  //여기서 부터 REDIS 기반 메서드
  @ApiOperation({ summary: '채널 멤버 조회' })
  @Get(':channelId/members')
  getChannelMembers(
    @ExtractUserIdFromToken() userId: bigint,
    // @Param('serverId') serverId: bigint,
    @Param('channelId') channelId: bigint,
  ) {
    return this.channelService.getMembers(channelId);
  }

  @ApiOperation({ summary: '채널 멤버 추가' })
  @Put(':channelId/join')
  joinChannel(
    @ExtractUserIdFromToken() userId: bigint,
    // @Param('serverId') serverId: bigint,
    @Param('channelId') channelId: bigint,
  ) {
    return this.channelService.addMember(userId, channelId);
  }

  @ApiOperation({ summary: '채널 떠나기' })
  @Put(':channelId/leave')
  leaveChannel(
    @ExtractUserIdFromToken() userId: bigint,
    // @Param('serverId') serverId: bigint,
    @Param('channelId') channelId: bigint,
  ) {
    return this.channelService.removeMember(userId, channelId);
  }

  // @Delete(':serverId/channels/:channelId/:userId')
  // @UseGuards(AccessTokenGuard)
  // deleteChannelUser(
  //   @User('id') id: number,
  //   @Param('serverId') serverId: number,
  //   @Param('channelId') channelId: number,
  //   @Param('userId') targetUserId?: number,
  // ) {
  //   return this.serversService.deleteChannelUser(
  //     id,
  //     serverId,
  //     channelId,
  //     targetUserId,
  //   );
  // }
}
