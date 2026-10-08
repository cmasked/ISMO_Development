export interface AppConfiguration {
  app: {
    environment: 'development' | 'test' | 'production';
    port: number;
    corsOrigins: string[];
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  jwt: {
    secret?: string;
    accessTokenTtlSeconds: number;
  };
}
