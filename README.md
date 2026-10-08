# Workframe

A project and task manager with a responsive web client and an Android app. Both clients use one NestJS API and PostgreSQL database.

## Features

- Register, sign in, sign out, persistent sessions and expiration handling.
- Projects with descriptions, statuses, scheduling dates, search and status filters.
- Tasks with descriptions, priorities, statuses, due dates and project relationships.
- Create, edit and delete projects/tasks; confirm destructive actions and mark tasks completed.
- Five dashboard counts: total projects, total tasks, completed tasks, pending tasks and projects in progress.
- Combined task name/status/priority/project filters.
- Bauhaus light/dark themes, responsive web layouts and native Android date selection.
- Refresh shared data across web and Android using the same account.

Project status is managed explicitly. Completion percentages are calculated from real tasks. Project deletion also deletes its tasks.

## Technology and structure

| Directory | Implementation |
| --- | --- |
| `web/` | React 19, TypeScript, Vite, React Router, TanStack Query, CSS, Playwright |
| `backend/` | NestJS 10, TypeORM, PostgreSQL 16, JWT/Passport, bcrypt, class-validator, Swagger |
| `mobile/` | React Native 0.81, Expo SDK 54, React Navigation, TanStack Query, Expo SecureStore |
| `docs/` | API contract, environment settings, database schema and verification records |

Web and Android send HTTPS requests to the same backend. The backend owns authentication, authorization, validation and database access. Neither client has a separate backend or local source of project/task records.

## Authentication and security

Passwords are hashed with bcrypt cost 12. Login returns a signed, expiring bearer token linked to a server-side session. Protected endpoints verify that session; logout revokes the current session while other device sessions remain valid.

The web client persists its session in browser localStorage; Android uses encrypted Expo SecureStore. Neither client stores passwords. Both clear authentication and cached account data after invalid/expired-session responses. Browser storage is exposed to scripts running on the same origin, so XSS protection remains important.

Project access is restricted to the owner. Task access is derived from the owning project, including task moves. Backend queries use parameters; unknown fields and invalid enums/dates are rejected. Authentication endpoints are rate-limited. Error responses and logs omit sensitive details. Database credentials and JWT signing secrets belong only on the backend.

## Environment variables

Copy `backend/.env.example` to `backend/.env` for local development. Keep real values out of source control.

| Backend variable | Value |
| --- | --- |
| `DATABASE_HOST` | PostgreSQL host; `127.0.0.1` locally, Render's internal hostname on Render |
| `DATABASE_PORT` | `5432` unless changed |
| `DATABASE_USER` | Your database username |
| `DATABASE_PASSWORD` | Your private database password |
| `DATABASE_NAME` | Your database name |
| `DATABASE_SSL` | `false` locally; `true` when your database connection requires TLS |
| `JWT_SECRET` | A private, strong random secret with at least 32 non-padding characters |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | `3600` by default |
| `CORS_ORIGINS` | Comma-separated exact browser origins, without paths or trailing slashes |
| `NODE_ENV` | `production` on Render |
| `PORT` | `3001` locally; use Render's assigned port in deployment |

Web production: `VITE_API_BASE_URL=https://ismo-development.onrender.com/api`.
Android: `EXPO_PUBLIC_API_BASE_URL=https://ismo-development.onrender.com/api`.

These client URLs are public build values, not secrets. Never put database credentials or a JWT signing secret into a `VITE_*` or `EXPO_PUBLIC_*` variable. See [the complete environment reference](docs/environment.md).

## Local development

Use Node.js 22 and npm. Local database setup needs Docker Compose or an existing PostgreSQL 16 database.

```sh
cp backend/.env.example backend/.env
# Fill in private local database settings and JWT_SECRET.
docker compose --env-file backend/.env up -d postgres
cd backend
npm ci
npm run migration:run
npm run start:dev
```

In another terminal:

```sh
cd web
cp .env.example .env
npm ci
npm run dev
```

Open http://localhost:3000. Vite forwards `/api` to http://127.0.0.1:3001. Set `WEB_PROXY_TARGET` when that address changes. Local scheduling dates use `YYYY-MM-DD`; creation timestamps use the backend's `createdAt` field.

For a local backend container:

```sh
docker compose --env-file backend/.env build backend
docker compose --env-file backend/.env up -d backend
```

Container startup applies pending migrations. Schema synchronization stays disabled. Existing Compose volumes retain their original database credentials; changing an environment file does not rewrite them.

## Backend deployment — Render

Use the repository's default branch, `feat/stage-1-foundation`, and root directory `backend`.

- Node build: `npm ci --include=dev && npm run build`
- Start: `npm run start:prod`
- The start script runs compiled TypeORM migrations before starting NestJS. A failed migration prevents startup.
- The Dockerfile also applies migrations on startup when using Render's Docker runtime.
- Keep the API and database in the same Render region when using the internal hostname.
- Set `CORS_ORIGINS=https://ismodevelopment-web.vercel.app`; add other exact origins only when needed.
- Verify `GET /api/health` returns `status: ok` and `database: up`.

No Render shell or paid pre-deploy command is required for this startup path.

## Web deployment — Vercel

Use root directory `web`, Vite as the framework, `npm ci` as the install command, `npm run build` as the build command and `dist` as the output directory.

Set `VITE_API_BASE_URL=https://ismo-development.onrender.com/api` before building. Client environment changes require a rebuild. Browser routes must resolve to `index.html`; [web/vercel.json](web/vercel.json) configures the SPA fallback for this behavior. Production deployments should use `feat/stage-1-foundation`.

## Android

Use Node.js 22, Java 17 and an Android SDK/emulator:

```sh
cd mobile
cp .env.example .env
npm ci
npx expo run:android
```

The default app configuration connects to the deployed HTTPS backend. Production builds reject localhost/private development hosts and disable cleartext traffic. The isolated CI emulator uses a separate test package and database.

Build a sideloaded demo APK:

```sh
npm run prebuild:android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
```

Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`. GitHub Actions also supplies an installable APK artifact. CI/local demo builds use the generated development signing key. Store distribution requires private production signing credentials; [mobile setup and EAS profiles](mobile/README.md) describe that release path.

## API and database

Swagger documents authentication, projects, tasks, dashboard and health endpoints. See [the API contract](docs/api.md) for exact envelopes, fields, enums and filters.

The schema contains users, auth sessions, projects and tasks. Users own projects; projects contain tasks. Foreign keys enforce relationships and cascading deletion. Versioned migrations manage schema changes. See [the database schema](docs/database-schema.md).

## Demo flow

1. Register, then sign in on web.
2. Create a project and open it.
3. Create a task, edit it and mark it completed.
4. Return to Dashboard and verify the updated counts.
5. Search/filter the task.
6. Sign in on Android using the same account and refresh.
7. Verify the project/task, then create or edit a task on Android.
8. Refresh web and verify the change; change its status on web and refresh Android.
9. Sign out and verify protected pages require authentication again.

## Verification

Backend:

```sh
cd backend
npm run typecheck
npm test
npm run test:integration
```

Backend integration tests create a disposable database and require a local PostgreSQL role with CREATE DATABASE permission. Never run them with production credentials.

Web:

```sh
cd web
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Android:

```sh
cd mobile
npm run lint
npm run typecheck
npm test
npm run export
MOBILE_TEST_API_URL=http://127.0.0.1:3001/api npm run test:integration
```

Use isolated test databases. The browser and native suites create synthetic accounts and exercise deletion. CI checks real API integration, native flows, web/Android synchronization, session behavior, themes and responsive layouts. Reports and screenshots are retained as workflow artifacts.

## Deployment URLs

- Web: https://ismodevelopment-web.vercel.app/
- Backend API: https://ismo-development.onrender.com/api
- API health: https://ismo-development.onrender.com/api/health
- Swagger: https://ismo-development.onrender.com/docs
- Android APK: download the artifact from the latest successful [Android workflow](https://github.com/cmasked/ISMO_Development/actions/workflows/android.yml).

## Known limitations

- The demo APK is intended for sideloading; it is not a Play Store release.
- Web bearer tokens persist in localStorage; Android tokens use encrypted device storage.
- Lists do not yet paginate. Offline editing, password reset, refresh tokens and team management are outside the implemented assignment scope.
- Render's free tier can delay the first request after inactivity. Both clients show connection/timeout feedback and offer retry.
- Dependency audit findings and verification limits are recorded in the final review; do not treat a successful build as proof of a clean security audit.
- A five-minute screen recording is a required submission attachment. Follow [the recording and submission checklist](docs/submission.md).
