import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileUploadsService } from 'src/file-uploads/file-uploads.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { TokenService } from 'src/global/token/token.service';
import * as crypto from 'node:crypto';
import { SignInDto } from './dto/sign-in.dto';
import { Request } from 'express';
import { ProducerService } from 'src/global/kafka/producer.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { RedisService } from 'src/global/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly fileUploadsService: FileUploadsService,
    private readonly producerService: ProducerService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private readonly prismaClient = this.prismaService.getInstance();
  private readonly redis = this.redisService.getRedisClient();

  async verifyEmail(userId: string, code: string) {
    try {
      if (code !== 'ngs') {
        throw new BadRequestException('잘못된 인증 코드입니다.');
      }

      const user = await this.prismaClient.user.findUnique({
        where: { id: Number(userId) },
      });

      if (!user) {
        throw new NotFoundException();
      }
      await this.prismaClient.user.update({
        where: { id: Number(userId) },
        data: { email_acceptance: 'true' },
      });
    } catch (error) {
      return '인증 실패';
    }

    return '인증 성공';
  }

  async setUserFriends(userId: bigint, friendId: bigint, isAccepted: boolean) {
    try {
      // const isRequested = await this.userFriendsRepository.findOne({
      //   where: {
      //     userApplicant2: { id: userId },
      //     userRecipient2: { id: userId },
      //   },
      // });
      // const isRequested = await this.prismaClient.user_friends.findFirst({
      //   where: {
      //     AND: [{ requestor_user_id: userId }, { recipient_user_id: friendId }],
      //   },
      // });
      // {
      //   requestor_user_id_recipient_user_id: {
      //     requestor_user_id: userId,
      //     recipient_user_id: friendId,
      //   },
      // },

      if (!isAccepted) {
        const friend = await this.prismaClient.user_friends.deleteMany({
          where: {
            OR: [
              { requestor_user_id: userId, recipient_user_id: friendId },
              { requestor_user_id: friendId, recipient_user_id: userId },
            ],
          },
        });
        if (friend.count) {
          return {
            message: 'success',
            data: {
              friend,
            },
          };
        } else {
          throw new Error('삭제할 친구가 없습니다.');
        }
      }

      const isRequested = await this.prismaClient.user_friends.findFirst({
        where: {
          requestor_user_id: userId,
          recipient_user_id: friendId,
          status: 'true',
        },
      });
      if (isRequested) {
        return {
          message: 'success',
          data: {
            isRequested,
          },
        };
      }

      const friend = await this.prismaClient.user_friends.updateMany({
        where: {
          OR: [
            {
              requestor_user_id: friendId,
              recipient_user_id: userId,
            },
          ],
        },
        data: { status: isAccepted.toString() },
      });

      if (friend.count) {
        return {
          message: 'success',
          data: {
            friend,
          },
        };
      }

      const newFriend = await this.prismaClient.user_friends.create({
        data: {
          requestor_user_id: userId,
          recipient_user_id: friendId,
          status: 'false',
        },
      });

      return {
        message: 'success',
        data: {
          newFriend,
        },
      };

      // if ((isRequested.status = 'true')) {
      //   const alreadyFriend = await this.prismaClient.user_friends.findFirst({
      //     where: {
      //       AND: [
      //         { requestor_user_id: userId },
      //         { recipient_user_id: friendId },
      //         { status: 'true' },
      //       ],
      //     },
      //   });

      //   alreadyFriend.status = isAccepted.toString();

      //   if (alreadyFriend.status === 'false') {
      //     // await this.userFriendsRepository.delete(alreadyFriend);
      //     await this.prismaClient.user_friends.deleteMany({
      //       where: alreadyFriend,
      //     });
      //   }
      // } else {
      //   const candidateFriend = await this.prismaClient.user_friends.findFirst({
      //     where: {
      //       requestor_user_id: userId,
      //       recipient_user_id: friendId,
      //     },
      //   });

      //   candidateFriend.status = isAccepted.toString();
      //   await this.prismaClient.user_friends.update({
      //     where: {
      //       requestor_user_id_recipient_user_id: {
      //         requestor_user_id: userId,
      //         recipient_user_id: friendId,
      //       },
      //     },
      //     data: { status: isAccepted.toString() },
      //   });
      // }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getUserFriends(id: bigint) {
    try {
      const userFriends = await this.prismaClient.user_friends.findMany({
        where: { requestor_user_id: id },
      });

      return {
        message: 'success',
        data: {
          userFriends,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        '친구 목록을 가져오는 중에 오류가 발생했습니다.',
      );
    }
  }

  async getUserProfile(id: number) {
    const userProfile = await this.prismaClient.user.findUnique({
      where: { id },
      select: {
        nickname: true,
        description: true,
        profile_image_url: true,
      },
    });

    if (!userProfile) {
      throw new NotFoundException();
    }

    return userProfile;
  }

  async updateUserProfile(id: bigint, updateProfileDto: UpdateUserProfileDto) {
    const { nickname, description, profileImageUrl } = updateProfileDto;

    const user = await this.prismaClient.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException();
    }

    if (nickname) {
      user.nickname = nickname;
    }

    if (description) {
      user.description = description;
    }

    if (profileImageUrl) {
      user.profile_image_url = profileImageUrl;
    }

    const newUser = await this.prismaClient.user.update({
      where: { id },
      data: user,
    });

    return newUser;
  }

  async deleteUser(userId: number) {
    await this.prismaClient.user.delete({ where: { id: userId } });
  }

  async logoutUser(userId: number) {
    await this.prismaClient.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }

  async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<{ profileImageUrl: string }> {
    await this.fileUploadsService.uploadFile([file]);
    return {
      profileImageUrl: file.originalname,
    };
  }

  async getUserInformation(id: bigint) {
    const userInformation = await this.prismaClient.user.findUnique({
      where: { id },
      select: {
        email: true,
        nickname: true,
        profile_image_url: true,
      },
    });

    if (!userInformation) {
      throw new NotFoundException();
    }

    return userInformation;
  }

  async updateUserInformation(id: number, updateUserDto: UpdateUserDto) {
    const { nickname, password, description, profileImageUrl, phoneNumber } =
      updateUserDto;

    const user = await this.prismaClient.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException();
    }

    if (nickname) {
      user.nickname = nickname;
    }

    if (password) {
      user.password = password;
    }

    if (description) {
      user.description = description;
    }

    if (profileImageUrl) {
      user.profile_image_url = profileImageUrl;
    }

    if (phoneNumber) {
      user.phone = phoneNumber;
    }

    const newUser = await this.prismaClient.user.update({
      where: { id },
      data: user,
    });

    return newUser;
  }

  async isEmailExisted(email: string): Promise<boolean> {
    const existingUser = await this.prismaClient.user.findUnique({
      where: { email },
    });

    return existingUser ? true : false;
  }

  async getUserById(id: bigint) {
    return this.prismaClient.user.findUnique({
      where: { id },
    });
  }

  public async signIn(signInDto: SignInDto) {
    //salt를 가져오기 위해 먼저 조회
    const user = await this.prismaClient.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('유저 정보가 일치하지 않습니다.');
    }

    const hashedPassword = await this.hashPassword(
      signInDto.password,
      user.password_salt,
    );
    if (user.password !== hashedPassword) {
      throw new UnauthorizedException('유저 정보가 일치하지 않습니다.');
    }

    const refreshToken = await this.tokenService.generateToken(
      { userId: user.id },
      '30d',
    );

    const accessToken = await this.tokenService.generateToken(
      { userId: user.id },
      '1d',
    );

    await this.prismaClient.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async createUser(user: {
    nickname: string;
    email: string;
    password: string;
  }) {
    const isEmailExisted = await this.isEmailExisted(user.email);
    if (isEmailExisted) {
      throw new BadRequestException('이미 가입한 email 입니다!');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await this.hashPassword(user.password, salt);

    const newUser = await this.prismaClient.user.create({
      data: {
        nickname: user.nickname,
        email: user.email,
        password: hash,
        password_salt: salt,
      },
    });

    return newUser;
  }

  async signUp(registerUserDto: RegisterUserDto) {
    const isEmailExisted = await this.isEmailExisted(registerUserDto.email);
    if (isEmailExisted) {
      throw new BadRequestException('이미 가입한 email 입니다!');
    }
    const newUser = await this.createUser({
      nickname: registerUserDto.nickname,
      email: registerUserDto.email,
      password: registerUserDto.password,
    });

    await this.producerService.createMessage(
      'push.release.ngs-mailer',
      'transmitWelcomeEmail',
      {
        userId: newUser.id.toString(),
        email: newUser.email,
        nickname: newUser.nickname,
        verificationCode: 'ngs',
      },
    );

    const { email, nickname } = newUser;

    return {
      email,
      nickname,
    };
  }

  public async renewToken(req: Request, userId: number) {
    const payload = await this.tokenService.verifyAccessToken(req);
    if (!payload) return;

    const user = await this.prismaClient.user.findUnique({
      where: { id: payload.payload.userId },
    });

    const refreshToken = await this.tokenService.generateToken(
      { userId: user.id },
      '30d',
    );

    const accessToken = await this.tokenService.generateToken(
      { userId: user.id },
      '1d',
    );

    if (!user) {
      throw new UnauthorizedException('유저 정보가 일치하지 않습니다.');
    }

    await this.prismaClient.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
    });

    return {
      accessToken: accessToken,
    };
  }

  private hashPassword(
    password,
    salt,
    iterations = 10,
    keyLength = 64,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLength,
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey.toString('hex'));
        },
      );
    });
  }

  public async addBlackList(userId: bigint, blackListId: bigint) {
    await this.redis.sAdd(`blackList_user:${userId}`, blackListId.toString());
  }

  public async removeBlackList(userId: bigint, blackListId: bigint) {
    await this.redis.sRem(`blackList_user:${userId}`, blackListId.toString());
  }

  public async findBlackList(userId: bigint) {
    await this.redis.sMembers(`blackList_user:${userId}`);
  }
}
