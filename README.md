# ISMO Project Management System

One NestJS backend serves the web application and the Android application. The assignment PDF defines the features; Travel-Backend guides the NestJS folder structure and coding conventions.

## Current scope: Backend, database, web and Android applications

Implemented: PostgreSQL entities/migration, registration/login/logout/current user, bcrypt password hashing, expiring JWT sessions, authentication rate limiting, owned project/task CRUD, combined search/filtering, and owner-scoped dashboard statistics. The Stage 1 infrastructure supplies strict TypeScript, validated configuration, global validation/error handling, CORS and Swagger.

The backend is under `backend/`. The responsive React application is under `web/` and consumes the same `/api` endpoints. It includes light/dark Bauhaus themes, authentication, dashboard counts, projects and tasks. The Expo Android application lives in `mobile/` and uses the same API and database. See [mobile/README.md](mobile/README.md) for setup, APK builds and verification.

See [web/README.md](web/README.md) for frontend setup, production hosting and browser verification. After starting the backend below, run `cd web`, `npm ci`, then `npm run dev` and open http://localhost:3000.

## Local development

Prerequisites: Node.js 22 or 24, npm, and Docker with the Compose plugin (or an existing PostgreSQL 16 database).

1. Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, and a strong random `JWT_SECRET` (at least 32 characters). Choose private local values; never commit `.env`. Set `CORS_ORIGINS` to the exact future web origin.
2. From the repository root, start PostgreSQL:

   ```sh
   docker compose --env-file backend/.env up -d postgres
   ```

3. Install and start the backend:

   ```sh
   cd backend
   npm ci
   npm run migration:run
   npm run start:dev
   ```

`DATABASE_HOST=127.0.0.1` connects the host-run application to the Compose database. If another service occupies port 5432 or 3001, select another `DATABASE_PORT` or `PORT` in `.env`.

The default backend port is 3001. `GET /api/health` returns the standard response envelope with `data.status=ok` and `data.database=up` after executing a PostgreSQL query. A failed database check returns HTTP 503. Swagger UI is at `/docs` and OpenAPI JSON at `/docs-json`. Use the login token as `Authorization: Bearer <token>` for protected requests. Production startup uses `npm run build`, then `npm run start:prod`. The production start script applies pending TypeORM migrations before starting the server; a migration failure prevents startup. On Render, use `backend` as the root directory, `npm ci --include=dev && npm run build` as the build command and `npm run start:prod` as the start command.

For a containerized backend, run from the repository root:

```sh
docker compose --env-file backend/.env up -d postgres
docker compose --env-file backend/.env build backend
docker compose --env-file backend/.env run --rm backend npm run migration:run:prod
docker compose --env-file backend/.env up -d backend
```

Compose uses `postgres:5432` inside the backend container automatically. Host ports are bound to loopback for local development. Database data persists in the Compose volume. Updating the database credentials in `.env` does not change an already initialized PostgreSQL volume; use matching credentials or a separately configured database.

The application Docker build remains unverified in this cloud environment because the container builder cannot resolve the npm registry. Host-run backend and Compose PostgreSQL operation are verified.

## Verification

Run from `backend/`:

```sh
npm run typecheck
npm run build
npm test
npm run test:integration
npm run migration:show
```

Unit checks verify environment validation, safe error handling, database options, and the shared validation pipe. Integration checks require PostgreSQL, valid `.env` settings and at least one `CORS_ORIGINS` entry. They exercise real HTTP/database flows, security, filtering, dashboard counts and migrations. The complete-flow suite creates and removes a randomly named test database, so use a local database role with CREATE DATABASE permission; never run it with production credentials. The validation probe controller exists only in the test application.

## Architecture

See [backend/README.md](backend/README.md) for conventions, scripts and logging; [environment variables](docs/environment.md), [API contract](docs/api.md), [database schema/ER diagram](docs/database-schema.md), and [Milestone 1 verification](docs/milestone-1-verification.md) document the implementation.

The application never synchronizes schema automatically. `npm run start:prod` applies pending migrations using the compiled migration files; local development uses the explicit migration command shown above. Project deletion permanently cascades to its tasks. Descriptions/dates are optional; project status is explicitly managed. Dashboard pending counts include only PENDING tasks. Web implementation and browser verification are covered in [web/README.md](web/README.md). Android implementation and verification are covered in [mobile/README.md](mobile/README.md). Store publishing remains a separate release step.
