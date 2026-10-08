import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig(): Omit<import('@nestjs/swagger').OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('ISMO Project Management API')
    .setDescription('Shared backend for the web and mobile applications. Stage 1 foundation.')
    .setVersion('0.1.0')
    .build();
}
