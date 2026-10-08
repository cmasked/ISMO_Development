# Backend

This project follows Travel-Backend's feature-module organization, dependency injection, strict TypeScript, DTO validation, Swagger decorators, global response interceptor, and global exception filter.

## Structure

```text
src/
  main.ts                 # startup and shutdown
  app.module.ts           # module composition and global providers
  app.setup.ts            # API prefix, validation, CORS, Swagger
  config/                 # typed configuration and environment validation
  database/               # shared TypeORM options and CLI data source
  modules/
    auth/                 # authentication, sessions and JWT strategy
    users/                # user repository and safe response DTO
    projects/             # owned project controller/service/repository
    tasks/                # owned task controller/service/repository
    dashboard/            # scoped SQL aggregate counts
    health/               # real PostgreSQL readiness check
  shared/
    constants/            # general HTTP error codes
    decorators/           # public/current user and validation helpers
    guards/               # JWT and persistent session protection
    enums/                # project/task statuses and task priority
    dto/                  # shared message response
    filters/              # uniform exception responses
    interceptors/         # uniform successful responses
    interfaces/           # API response types
    utils/                # shared validation pipe factory
  swagger/                # OpenAPI setup
```

Each feature owns its module, controller, service, repository, DTOs, entities and responses as needed. Controllers handle HTTP input, services enforce ownership/business rules, and repositories perform parameterized database operations. Password hashes are excluded from ordinary selects; explicit user response mapping excludes sensitive fields. No default account/password or personal-data seed is included.

## Response contract

Successful controller responses use `{ success: true, data, message: "Success", code: "OK" }`. Errors use `{ success: false, data: null, message, code }` with the correct HTTP status. Unknown server errors return a generic message. Swagger UI and its raw OpenAPI document use their native formats.

The global validation pipe transforms requests into DTO classes, rejects unexpected properties/invalid fields, and does not implicitly coerce values. Dates must be real calendar days in YYYY-MM-DD form. Partial updates validate merged date ranges and reject null for required fields/enums; nullable descriptions/dates can be cleared. Passwords are not trimmed and cannot exceed bcrypt's 72 UTF-8 byte limit.

## Authentication and sessions

The global JWT guard protects controllers unless marked `@Public()`. Registration/login/readiness are public; Swagger uses native documentation routes. JWTs use HS256, an environment-supplied secret, fixed issuer/audience, expiry and a session ID. Every protected request validates an existing, unexpired, unrevoked database session tied to its user. Logout revokes only the current session, allowing separate web/mobile sessions.

Registration and login each allow 10 requests per 60 seconds per client IP/endpoint. HTTP 429 includes Retry-After. The basic limiter is process-local and resets on restart; multiple replicas should use a shared limiter store when deploying at that scale. Forwarded IP headers are not trusted by default; configure a trusted proxy deliberately for the selected deployment infrastructure.

## Database and migrations

Run all commands from `backend/`, where the CLI loads `.env`. Both NestJS and the TypeORM CLI use `buildDatabaseOptions`; entity and migration discovery works from TypeScript source and compiled JavaScript.

```sh
npm run migration:show
# When introducing a future schema change:
npm run migration:generate -- src/database/migrations/DescriptiveChange
npm run migration:run
# Revert the last migration only when intentionally undoing that schema change:
npm run migration:revert
# Compiled production migration runner:
npm run migration:run:prod
```

The initial migration creates users, auth_sessions, projects and tasks. Add future versioned migrations under `src/database/migrations/`; do not edit migrations after deployment. `synchronize` and `migrationsRun` are always false. The integration suite verifies migration rollback/reapplication, repeat runs and agreement between entities and migrated schema. Reverting the initial migration destroys its schema/data; tests do this only in their own disposable database.

Development: `npm run start:dev`. Build/typecheck: `npm run build` and `npm run typecheck`. Production: `npm run start:prod` applies pending compiled migrations before starting NestJS (the Docker startup command does the same). Verification: `npm test` and `npm run test:integration` (the complete-flow suite needs a local role allowed to create test databases).

## Logging and startup failures

Nest's logger records successful startup/routes and sanitized server-error status/code. It never records request bodies, authorization headers, JWTs, credentials, raw driver errors or arbitrary exception stacks. Expected client errors are returned without logging their submitted values.

Startup errors deliberately use a generic message because driver exceptions can embed connection details. Check documented binding names/presence and database availability without printing values. Never log `.env`, process environment values or credential-bearing connection strings. Operation logs identify successful registration/login/logout and project/task mutations without sensitive request data.

## CORS and clients

`CORS_ORIGINS` contains exact web origins. Allowed browser origins receive CORS response headers; unlisted origins do not. Native requests without an Origin header reach the API normally. CORS does not replace authentication/authorization. Cookie credentials are disabled; clients use Authorization bearer tokens.

The server listens on `0.0.0.0` for container/mobile compatibility. Compose exposes its host port only on loopback; the Android production app connects to the deployed HTTPS API. See `mobile/README.md` for physical-device and emulator setup.
