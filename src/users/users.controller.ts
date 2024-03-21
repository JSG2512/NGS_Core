import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { isPublic } from 'src/common/decorator/is-public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractUserIdFromToken } from '../common/decorator/extract-userid-from-token.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '이메일 인증' })
  @Get('verify-email/:userId/:code')
  @isPublic()
  verifyEmail(@Param('userId') userId: string, @Param('code') code: string) {
    return this.usersService.verifyEmail(userId, code);
  }

  @ApiOperation({ summary: '엑세스 토큰 갱신' })
  @Get('credentials/accessToken')
  @isPublic()
  postTokenAccess(
    @Res() res: Response,
    @ExtractUserIdFromToken('id') userId: number,
    @Req() req: Request,
  ) {
    return this.usersService.renewToken(req, userId);
  }

  @ApiOperation({ summary: '회원 탈퇴' })
  @Delete()
  deleteUser(@ExtractUserIdFromToken('id') userId: number) {
    return this.usersService.deleteUser(userId);
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  postLogoutUser(@ExtractUserIdFromToken('id') userId: number) {
    return this.usersService.logoutUser(userId);
  }

  @ApiOperation({ summary: '로컬 계정으로 로그인' })
  @Post('login/local')
  @isPublic()
  async postLoginEmail(@Body() signInDto: SignInDto, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.usersService.signIn(signInDto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    res.send({
      accessToken,
    });
  }

  @ApiOperation({ summary: '회원가입' })
  @Post()
  @isPublic()
  signUp(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.signUp(registerUserDto);
  }

  @ApiOperation({ summary: '친구 목록 불러오기' })
  @Get('friends')
  getUserFriends(@ExtractUserIdFromToken() userId: bigint) {
    console.log('여기여기');
    return this.usersService.getUserFriends(userId);
  }

  @ApiOperation({ summary: '회원 정보 조회' })
  @Get(':id')
  getUsersInformation(@Param('id') id: bigint) {
    return this.usersService.getUserInformation(id);
  }

  @ApiOperation({ summary: '이메일(pk) 중복 확인' })
  @Get('id-duplicated')
  @isPublic()
  isEmailExisted(email: string) {
    return this.usersService.isEmailExisted(email);
  }

  @ApiOperation({ summary: '회원 정보 수정' })
  @Patch(':id')
  updateUserInformation(@Param('id') id: number, @Body() body: UpdateUserDto) {
    return this.usersService.updateUserInformation(id, body);
  }

  @Post('user-id')
  findId() {}

  @Post('user-password')
  findPassword() {}

  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @Put('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadProfileImage(file);
  }

  @ApiOperation({ summary: '내/상대방 프로필 정보 가져오기' })
  @Get('profile/:id')
  getUserProfile(@Param('id') userId: number) {
    return this.usersService.getUserProfile(userId);
  }

  @ApiOperation({ summary: '유저 프로필 정보 수정' })
  @Patch('profile')
  postUserProfile(
    @ExtractUserIdFromToken() userId: bigint,
    @Body() body: UpdateUserProfileDto,
  ) {
    return this.usersService.updateUserProfile(userId, body);
  }

  @ApiOperation({
    summary: '친구 추가/상대방으로 부터 온 친구 추가요청의 수락/거절',
  })
  @Put('friends/:id')
  setUserFriends(
    @ExtractUserIdFromToken('id') userId: bigint,
    @Param('id') friendId: bigint,
    @Body() body: { isAccepted: boolean },
  ) {
    return this.usersService.setUserFriends(userId, friendId, body.isAccepted);
  }

  @ApiOperation({ summary: '블랙리스트 추가' })
  @Post('black/:id')
  addBlackList(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('id') blackUserId: bigint,
  ) {
    return this.usersService.addBlackList(userId, blackUserId);
  }

  @ApiOperation({ summary: '블랙리스트 제거' })
  @Delete('black/:id')
  removeBlackList(
    @ExtractUserIdFromToken() userId: bigint,
    @Param('id') blackUserId: bigint,
  ) {
    return this.usersService.removeBlackList(userId, blackUserId);
  }

  @ApiOperation({ summary: '블랙리스트 조회' })
  @Get('black')
  getBlackList(@ExtractUserIdFromToken() userId: bigint) {
    return this.usersService.findBlackList(userId);
  }

  @ApiOperation({ summary: '유저 정보 조회' })
  @Get('')
  getUser(@ExtractUserIdFromToken() userId: bigint) {
    return this.usersService.getUserInformation(userId);
  }
}
