import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { ExtractUserIdFromToken } from '../common/decorator/extract-userid-from-token.decorator';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServerInvitationDto } from './dto/server-invitation.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('server')
@Controller('server')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @ApiOperation({ summary: '서버 생성' })
  @Post()
  async createServer(
    @ExtractUserIdFromToken() ownerId: bigint,
    @Body() body: CreateServerDto,
  ) {
    const newServer = await this.serversService.createServer(ownerId, body);

    return this.serversService.getServerById(newServer.id);
  }

  @ApiOperation({ summary: '서버 조회' })
  @Get('') // 분기처리 - 쿼리파라미터 없을 경우 전체 조회 있을 경우 검색
  getServers(@Query('keyword') query?: string) {
    return this.serversService.getServers(query);
  }

  @ApiOperation({ summary: '서버 조회' })
  @Get(':serverId')
  getServer(@Param('serverId') id: bigint) {
    return this.serversService.getServerById(id);
  }

  @ApiOperation({ summary: '서버 정보 수정' })
  @Patch('/:serverId')
  updateServer(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId', ParseIntPipe) serverId: bigint,
    @Body() body: UpdateServerDto,
  ) {
    return this.serversService.updateServer(userId, serverId, body);
  }

  @ApiOperation({ summary: '서버 초대 링크 생성' })
  @Post('/:serverId/invitation')
  createServerInvitation(
    @ExtractUserIdFromToken() ownerid: bigint,
    @Body() serverInvitationDto: ServerInvitationDto,
  ) {
    return this.serversService.generateInviteLink(ownerid, serverInvitationDto);
  }

  @ApiOperation({ summary: '서버 탈퇴' })
  @Delete('/:serverId/:userId')
  deleteServerUser(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
    @Param('userId') targetUserId?: bigint,
  ) {
    return this.serversService.deleteServerUser(userId, serverId, targetUserId);
  }

  @ApiOperation({ summary: '서버 삭제' })
  @Delete('/:serverId')
  deleteServer(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId', ParseIntPipe) serverId: bigint,
  ) {
    return this.serversService.deleteServer(userId, serverId);
  }

  @ApiOperation({ summary: '서버에 가입' })
  @Post(':serverId/user')
  // @UseGuards(AccessTokenGuard)
  joinServer(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('serverId') serverId: bigint,
  ) {
    return this.serversService.joinServer(userId, serverId);
  }
}
