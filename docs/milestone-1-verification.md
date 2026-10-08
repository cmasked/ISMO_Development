# Milestone 1 verification

Validated on 2026-10-08 with Node.js 24.19.0, npm 11.9.0 and PostgreSQL 16. This milestone covers the backend/database only. Travel-Backend remains unchanged.

| Command/check | Result |
| --- | --- |
| Dependency installation via npm | Passed; lockfile updated |
| `npm run typecheck` | Passed |
| `npm test` | 10 passed, 0 failed/skipped; also builds the backend |
| `npm run test:integration` | 19 passed, 0 failed/skipped; real PostgreSQL and HTTP requests |
| `npm run migration:run` | Initial schema applied successfully |
| `npm run migration:run:prod` | Compiled runner passed; no pending migrations on repeat |
| Migration rollback/reapplication | Passed in a randomly named disposable database |
| Entity/migrated-schema comparison | No pending schema changes |
| `PORT=3002 npm run start:prod` | Compiled application started successfully |
| Live production HTTP workflow | Registration → login → current user → create project → create task → update → complete → dashboard → logout passed |
| `/docs`, `/docs-json`, readiness | Passed; all required endpoints are documented |

## Required behavior verified

- Bcrypt hashing and unique normalized email, without hash/password fields in responses.
- Safe login failures, mandatory JWT protection, expired/tampered tokens, immediate logout revocation and independent device sessions.
- Registration/login input validation and authentication rate limiting (429 with Retry-After).
- Project/task CRUD, completion, task movement between owned projects, and project deletion cascading to tasks.
- Cross-user read/update/delete/create/move restrictions and owner-scoped lists/dashboard statistics.
- Combined name/status/priority/project filters, literal wildcard handling and parameterized queries.
- Blank/unknown fields, null non-nullable fields, UUIDs, enums, real calendar dates and merged project date ranges.
- Database-level foreign keys, nonblank names and project date ordering.
- CORS allowlisting/preflight, global response/error envelopes and sensitive error data excluded from responses/logs.

The complete-flow tests create and drop only their unique test database. Live smoke verification created and removed only its generated synthetic account and associated records. Existing configured application data is preserved.

## Corrections during implementation

Schema comparison identified missing check/foreign-key metadata in entities. Matching metadata was added so future generated migrations preserve the intended constraints. Nullable update handling and PostgreSQL-supported calendar years are explicitly validated. Database constraint conflicts return safe client errors, and authentication database failures return service-unavailable errors.

Port 3001 was occupied by the earlier development server. The compiled startup and live-flow check were repeated successfully with the supported PORT override on 3002.

## Remaining limits

No required backend failure remains in these checks. The existing Docker application-image build remains unverified because Docker's package-registry DNS is unavailable in this cloud environment (see the historical Stage 1 report). Compose PostgreSQL works. Rate limiting is process-local, as documented; distributed limiting is a future deployment concern. PostgreSQL/TypeORM emits a non-failing deprecation warning during schema introspection on the current driver versions.

No web/mobile implementation, public deployment URL or Android artifact is claimed by this milestone. Configure private database bindings and JWT_SECRET on another machine, run migrations and follow the root README to reproduce startup.
