import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig(): Omit<
  import('@nestjs/swagger').OpenAPIObject,
  'paths'
> {
  return new DocumentBuilder()
    .setTitle('ISMO Project Management API')
    .setDescription(
      'Shared project management backend for web and mobile. Login and use the returned bearer token. All feature data is scoped to its owner.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
}
