import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  private readonly prisma = new PrismaClient();

  public async onModuleInit() {
    await this.prisma.$connect();
  }

  public async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  public getInstance() {
    return this.prisma;
  }
}
