# Backend foundation

This project follows Travel-Backend's feature-module organization, dependency injection, strict TypeScript, DTO validation, Swagger decorators, global response interceptor, and global exception filter.

## Structure

```text
src/
  main.ts                 # startup and shutdown
  app.module.ts           # module composition and global providers
  app.setup.ts            # API prefix, validation, CORS, Swagger
  config/                 # typed configuration and environment validation
  database/               # shared TypeORM options and CLI data source
  modules/health/         # real PostgreSQL readiness check
  shared/
    constants/            # general HTTP error codes
    filters/              # uniform exception responses
    interceptors/         # uniform successful responses
    interfaces/           # API response types
    utils/                # shared validation pipe factory
  swagger/                # OpenAPI setup
```

Future `auth`, `users`, `projects`, `tasks`, and `dashboard` folders go under `modules/`. Each feature owns its module, controller, service, repository, DTOs, entities and response interfaces as needed. Controllers handle HTTP input, services enforce business rules, and repositories handle database access. Shared decorators, guards, enums and DTOs will be added when those stages introduce concrete requirements. There are no empty placeholder classes or feature modules at this stage.

## Response contract

Successful controller responses use `{ success: true, data, message: "Success", code: "OK" }`. Errors use `{ success: false, data: null, message, code }` with the correct HTTP status. Unknown server errors return a generic message. Swagger UI and its raw OpenAPI document use their native formats.

The global validation pipe transforms requests into explicitly declared DTO classes, rejects unexpected properties and invalid fields, and does not implicitly coerce values. Future DTOs must declare validation decorators; no feature-specific DTOs are implemented yet.

## Database and migrations

Run all commands from `backend/`, where the CLI loads `.env`. Both NestJS and the TypeORM CLI use `buildDatabaseOptions`; entity and migration discovery works from TypeScript source and compiled JavaScript.

```sh
npm run migration:show
# When Stage 2 introduces entities:
npm run migration:generate -- src/database/migrations/InitialSchema
npm run migration:run
# Revert the last migration only when intentionally undoing that schema change:
npm run migration:revert
# Compiled production migration runner:
npm run migration:run:prod
```

Add versioned migration files under `src/database/migrations/` in Stage 2. No migrations or entities are included now. `synchronize` and `migrationsRun` are always false. `migration:show` reads migration status; TypeORM's `migration:run` may create its metadata table even when no migrations exist.

## Logging and startup failures

Nest's logger records successful startup/routes and sanitized server-error status/code. It never records request bodies, authorization headers, JWTs, credentials, raw driver errors or arbitrary exception stacks. Expected client errors are returned without logging their submitted values.

Startup errors deliberately use a generic message because driver exceptions can embed connection details. Validate settings locally with `npm test`, check the documented required bindings without printing their values, and inspect database health/access. Never log `.env`, process environment values or credential-bearing database connection strings.

## CORS and clients

`CORS_ORIGINS` contains exact web origins. Allowed browser origins receive CORS response headers; unlisted origins do not. Requests without an Origin header, including native mobile clients, can reach the API. CORS is a browser policy and does not replace the authentication/authorization that will be implemented later. Cookie credentials are disabled; later clients will use Authorization bearer tokens.

The server listens on `0.0.0.0` for container/mobile compatibility. Compose exposes its host port only on loopback; choose an explicit network/deployment configuration when connecting a physical mobile device in a later stage.
