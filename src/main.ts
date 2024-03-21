import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BaseAPIDocument } from './common/document/swagger.document';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from './global/swagger/swagger';

/*
내부적으로는 BigInt를 사용하고 있지만, JSON으로 변환할 때는 String으로 변환되도록 설정
각 테이블의 pk id는 bigint로 설정되어 있기 때문에, 이를 JSON으로 변환할 때는 String으로 변환되도록 설정
pk가 bigint인 경우, JSON으로 변환할 때 Number로 변환되어 버리기 때문에 이를 방지하기 위함
pk가 number 범위를 넘어가면 오류가 발생할 것, 추후 수정 필요
*/
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();
  setupSwagger(app);
  await app.listen(3000);
}

bootstrap();
