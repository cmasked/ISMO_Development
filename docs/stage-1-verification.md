# Stage 1 verification

This is the historical foundation baseline. See [Milestone 1 verification](milestone-1-verification.md) for the current backend/database status; JWT configuration is now required and application migrations/entities are implemented.

Validated in the cloud workspace on 2026-10-08 using Node.js 24.19.0, npm 11.9.0 and PostgreSQL 16. All checks below concern foundation behavior; no feature schema or feature endpoints were implemented.

| Command/check | Result |
| --- | --- |
| `npm install --no-audit --no-fund` | Passed; committed npm lockfile generated |
| `npm run typecheck` | Passed |
| `npm run build` (also run by the test commands) | Passed, including repeated clean builds |
| `npm test` | 10 passed, 0 failed, 0 skipped |
| `npm run test:integration` | 5 passed, 0 failed, 0 skipped against real PostgreSQL |
| `npm run migration:show` | Passed; no versioned migrations exist yet |
| `docker compose --env-file backend/.env config --quiet` | Passed |
| `docker compose --env-file backend/.env up -d postgres` | Passed; PostgreSQL healthy |
| `npm run start:dev` | Passed; watch compilation reports 0 errors |
| HTTP `/api/health` | Passed; real query confirms database is up |
| HTTP `/docs` and `/docs-json` | Passed; application OpenAPI includes only `/api/health` |

Integration checks exercised the actual global validation pipe and error filter using a controller loaded only by the test application. They also verified CORS allowlisting, preflight responses, and that no tables were created by application initialization/readiness requests. Configuration checks cover missing/invalid bindings, optional future JWT settings, schema synchronization disabled, TLS verification, and sensitive error data excluded from responses/logs.

## Issues resolved

Repeated builds initially removed `dist` without recreating it because Nest's clean-build option and TypeScript's retained incremental state conflicted. Incremental compilation was disabled; subsequent builds, unit checks, integration checks, and development startup passed.

## Container build limitation

The Dockerfile and Compose configuration are included. The backend image build could not be validated in this cloud workspace: npm installation inside the builder failed, and a separate registry connectivity check confirmed DNS failure (`EAI_AGAIN`) inside a Docker container. A retry requiring forwarded proxy settings, a trusted CA certificate and host networking was rejected by automatic approval review. No verification was disabled and no proxy/secret values were committed. The backend itself was fully validated outside the Docker builder; full image startup remains unverified.

## Local configuration

An ignored, permission-restricted `backend/.env` was generated for validation with a random local database password. It is not part of the repository. Other developers must copy `.env.example` and supply their own database settings as documented in the root README.
