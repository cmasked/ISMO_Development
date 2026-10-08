import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfiguration } from '../config/configuration.interface';
import { buildDatabaseOptions } from './database.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDatabaseOptions(config.getOrThrow<AppConfiguration['database']>('database')),
        retryAttempts: 1,
        // The driver error can contain connection details. Startup reports a safe failure.
        toRetry: () => false,
      }),
    }),
  ],
})
export class DatabaseModule {}
