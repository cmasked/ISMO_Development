import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from './config/configuration.interface';
import { createValidationPipe } from './shared/utils/validation.util';
import { setupSwagger } from './swagger/swagger.setup';

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);
  const origins = config.getOrThrow<AppConfiguration['app']['corsOrigins']>('app.corsOrigins');
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || origins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });
  setupSwagger(app);
}
