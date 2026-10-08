import { AppConfiguration } from './configuration.interface';

/** Validate configuration without including submitted values in error messages. */
export function validateEnvironment(env: Record<string, unknown>): AppConfiguration {
  const invalid = new Set<string>();

  const requiredString = (name: string): string => {
    const value = env[name];
    if (typeof value !== 'string' || !value.trim()) {
      invalid.add(name);
      return '';
    }
    return value;
  };

  const integer = (name: string, fallback: number, max: number): number => {
    const value = env[name] ?? String(fallback);
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      invalid.add(name);
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) invalid.add(name);
    return parsed;
  };

  const environment = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(String(environment))) {
    invalid.add('NODE_ENV');
  }

  const ssl = env.DATABASE_SSL ?? 'false';
  if (ssl !== 'true' && ssl !== 'false') invalid.add('DATABASE_SSL');

  const origins = typeof env.CORS_ORIGINS === 'string'
    ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
  if (env.CORS_ORIGINS !== undefined && typeof env.CORS_ORIGINS !== 'string') {
    invalid.add('CORS_ORIGINS');
  }
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
        invalid.add('CORS_ORIGINS');
      }
    } catch {
      invalid.add('CORS_ORIGINS');
    }
  }

  const secret = env.JWT_SECRET === '' ? undefined : env.JWT_SECRET;
  if (secret !== undefined && (typeof secret !== 'string' || secret.trim().length < 32)) {
    invalid.add('JWT_SECRET');
  }

  const configuration: AppConfiguration = {
    app: {
      environment: environment as AppConfiguration['app']['environment'],
      port: integer('PORT', 3001, 65535),
      corsOrigins: [...new Set(origins)],
    },
    database: {
      host: requiredString('DATABASE_HOST').trim(),
      port: integer('DATABASE_PORT', 5432, 65535),
      username: requiredString('DATABASE_USER').trim(),
      password: requiredString('DATABASE_PASSWORD'),
      name: requiredString('DATABASE_NAME').trim(),
      ssl: ssl === 'true',
    },
    jwt: {
      secret: typeof secret === 'string' ? secret : undefined,
      accessTokenTtlSeconds: integer('JWT_ACCESS_TOKEN_TTL_SECONDS', 3600, 86400),
    },
  };

  if (invalid.size) {
    throw new Error(`Invalid or missing environment variables: ${[...invalid].join(', ')}`);
  }
  return configuration;
}
