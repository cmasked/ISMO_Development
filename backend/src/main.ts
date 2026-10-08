import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { abortOnError: false, logger: false });
  app.useLogger(new Logger());
  configureApplication(app);
  app.enableShutdownHooks();
  const port = app.get(ConfigService).getOrThrow<number>('app.port');
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`ISMO API listening on port ${port}; documentation at /docs`);
}

void bootstrap().catch(() => {
  // Driver/configuration exceptions may contain sensitive connection values.
  new Logger('Bootstrap').error('Startup failed. Check environment configuration and PostgreSQL availability.');
  process.exit(1);
});
