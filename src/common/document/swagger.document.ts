import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

export class BaseAPIDocument {
  public builder = new DocumentBuilder();

  public initializeOptions() {
    return this.builder
      .setTitle('NGS')
      .setDescription('NGS API')
      .setVersion('1.0.0')
      .addTag('NGS')
      .build();
  }
}