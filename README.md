# ISMO Project Management System

One NestJS backend will serve the web and Android applications. The assignment PDF defines the features; Travel-Backend guides the NestJS folder structure and coding conventions.

## Current scope: Stage 1 foundation

Implemented: strict TypeScript, environment validation, PostgreSQL/TypeORM connection, migration CLI, global request validation, response envelopes, safe exception handling, CORS, Swagger, and a real database readiness check. Authentication, user/project/task tables, and dashboard features belong to subsequent stages.

The backend is under `backend/`. Future `web/` and `mobile/` applications will consume the same `/api` endpoints.

## Local development

Prerequisites: Node.js 22 or 24, npm, and Docker with the Compose plugin (or an existing PostgreSQL 16 database).

1. Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME`. Choose a local database password; never commit `.env`.
2. From the repository root, start PostgreSQL:

   ```sh
   docker compose --env-file backend/.env up -d postgres
   ```

3. Install and start the backend:

   ```sh
   cd backend
   npm ci
   npm run start:dev
   ```

`DATABASE_HOST=127.0.0.1` connects the host-run application to the Compose database. If another service occupies port 5432 or 3001, select another `DATABASE_PORT` or `PORT` in `.env`.

The default backend port is 3001. `GET /api/health` returns the standard response envelope with `data.status=ok` and `data.database=up` after executing a PostgreSQL query. A failed database check returns HTTP 503. Swagger UI is at `/docs` and OpenAPI JSON at `/docs-json`.

For a containerized backend, run from the repository root:

```sh
docker compose --env-file backend/.env up --build -d
```

Compose uses `postgres:5432` inside the backend container automatically. Host ports are bound to loopback for local development. Database data persists in the Compose volume. Updating the database credentials in `.env` does not change an already initialized PostgreSQL volume; use matching credentials or a separately configured database.

## Verification

Run from `backend/`:

```sh
npm run typecheck
npm run build
npm test
npm run test:integration
npm run migration:show
```

Unit checks verify environment validation, safe error handling, database options, and the shared validation pipe. Integration checks require PostgreSQL and valid `.env` settings with at least one `CORS_ORIGINS` entry. They start a temporary test server, check its real database connection, Swagger, CORS and HTTP validation, then close it. The validation probe controller exists only in the test application.

## Architecture

See [backend/README.md](backend/README.md) for the folder conventions, database commands, and logging policy. Environment variables are documented in [docs/environment.md](docs/environment.md).

No application entities or versioned migrations exist in Stage 1. The application never synchronizes schema or runs migrations automatically. Run future migrations explicitly before deployment.
