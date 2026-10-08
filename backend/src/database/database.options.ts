import { join } from 'node:path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AppConfiguration } from '../config/configuration.interface';

/** Shared by the application and migration CLI to prevent configuration drift. */
export function buildDatabaseOptions(
  database: AppConfiguration['database'],
): PostgresConnectionOptions {
  return {
    type: 'postgres',
    uuidExtension: 'pgcrypto',
    installExtensions: false,
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.name,
    ssl: database.ssl ? { rejectUnauthorized: true } : false,
    entities: [join(__dirname, '../modules/**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    extra: { max: 5, connectionTimeoutMillis: 5000 },
  };
}
