# Backend environment configuration

Create `backend/.env` from `backend/.env.example`. Existing process environment variables take precedence. No secret values are committed. Supply deployment values through the host's secure environment settings.

| Variable | Required now | Meaning/default |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test` or `production`; default `development` |
| `PORT` | No | HTTP port, integer 1–65535; default `3001` |
| `DATABASE_HOST` | Yes | PostgreSQL hostname; use `127.0.0.1` for the host-run Compose database |
| `DATABASE_PORT` | No | PostgreSQL port, integer 1–65535; default `5432` |
| `DATABASE_USER` | Yes | PostgreSQL username; no default |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password; no default; whitespace is preserved |
| `DATABASE_NAME` | Yes | Database name; no default |
| `DATABASE_SSL` | No | Exactly `true` or `false`; default `false` for local PostgreSQL. When enabled, certificate verification remains on |
| `CORS_ORIGINS` | No | Comma-separated exact HTTP/HTTPS web origins. Empty means no cross-origin browser access. No wildcard, credentials, paths or trailing slash |
| `JWT_SECRET` | No, Stage 1 only | Reserved for later authentication. If supplied, at least 32 non-padding characters; no fallback secret |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | No | Reserved token lifetime, integer 1–86400; default `3600` |

JWT configuration does not activate authentication at this stage. The authentication stage must require a valid signing secret before introducing protected APIs.

Use the same database variables when invoking Docker Compose with `--env-file backend/.env`. Compose injects them into PostgreSQL and overrides the backend container's database host/port with its service address.

For managed PostgreSQL, enable `DATABASE_SSL=true` when TLS is required and use a certificate trusted by the system. Do not disable certificate verification to work around connection failures. Custom CA installation and production infrastructure configuration can be added when a deployment target is selected.
