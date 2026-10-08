# Backend API contract

Both clients use the same `/api` endpoints. Swagger UI is at `/docs`; OpenAPI JSON is at `/docs-json`.

## Responses and authentication

Successful controller responses use `{ success: true, data, message: "Success", code: "OK" }`. Errors use `{ success: false, data: null, message, code }` with the correct HTTP status. Swagger UI/JSON use native formats.

| Status | Typical codes |
| --- | --- |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `SESSION_INVALID` |
| 404 | `NOT_FOUND` (also used for foreign-owned resource IDs) |
| 409 | `EMAIL_ALREADY_EXISTS`, `CONFLICT` |
| 429 | `RATE_LIMITED`; includes `Retry-After` |
| 503 | `SERVICE_UNAVAILABLE` |
| 500 | `INTERNAL_ERROR`; sensitive details are hidden |

Use `Authorization: Bearer <accessToken>` on protected requests. Login returns the token and `expiresAt`; retain it until logout/expiration. On HTTP 401, clear the local session and return to login. Native mobile must use secure device storage in its milestone. Refresh tokens are not part of the required implementation.

## Required endpoints

| Method | Path | Response data |
| --- | --- | --- |
| POST | `/api/auth/register` | 201: safe user |
| POST | `/api/auth/login` | 200: token, expiry, safe user |
| POST | `/api/auth/logout` | 200: confirmation |
| GET | `/api/auth/me` | 200: safe user |
| GET | `/api/projects` | 200: owned project array |
| GET | `/api/projects/{id}` | 200: owned project |
| POST | `/api/projects` | 201: created project |
| PUT | `/api/projects/{id}` | 200: updated project |
| DELETE | `/api/projects/{id}` | 200: confirmation; tasks cascade |
| GET | `/api/tasks` | 200: owned task array |
| GET | `/api/tasks/{id}` | 200: owned task |
| POST | `/api/tasks` | 201: created task |
| PUT | `/api/tasks/{id}` | 200: updated task |
| DELETE | `/api/tasks/{id}` | 200: confirmation |
| GET | `/api/dashboard` | 200: owner-scoped counts |

Registration/login are public. All other listed routes require a bearer token. Public `GET /api/health` checks PostgreSQL readiness; a failed query returns 503. Registration/login each allow 10 requests per minute per IP/endpoint.

## Account requests

Registration accepts `fullName`, `email`, `password`. Full name is trimmed, nonblank and at most 150 characters. Email is trimmed, lowercased, validated, unique and at most 254 characters. Passwords must be at least 8 characters, contain a non-whitespace character and fit within 72 UTF-8 bytes. They are hashed with bcrypt cost 12 and never returned.

Login accepts `email` and `password`. Safe user objects contain `id`, `fullName`, `email`, `createdAt`, `updatedAt`. Login response data additionally contains `accessToken`, `tokenType: "Bearer"`, `expiresAt` (ISO timestamp) and `user`. Registration creates the account; login is separate. Logout requires no body, immediately invalidates the current token, and preserves other device sessions.

Example registration (test data):

```json
{ "fullName": "Test User", "email": "user@example.test", "password": "Choose-a-test-password" }
```

## Projects

Create accepts required `name` and optional `description`, `status`, `startDate`, `endDate`:

```json
{
  "name": "Test Release",
  "description": "Shared project",
  "status": "NOT_STARTED",
  "startDate": "2026-10-01",
  "endDate": "2026-10-31"
}
```

Name is trimmed/nonblank and at most 150 characters. Description may be null and is capped at 10000 characters. Status is `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`; default `NOT_STARTED`. Dates are optional real calendar dates in `YYYY-MM-DD` format or null. End must be on/after start when both are set.

PUT updates only supplied fields and requires at least one field. Omitted fields are preserved; null clears descriptions/dates only. Date ordering uses the resulting record. Owners/IDs/timestamps cannot be supplied or changed. Project status is managed explicitly rather than inferred from task completion.

Project response data: `id`, `ownerId`, `name`, `description`, `status`, `startDate`, `endDate`, `createdAt`, `updatedAt`.

Filters combine with AND: `GET /api/projects?search=release&status=IN_PROGRESS`.

## Tasks

Create requires `projectId` (owned project UUID v4) and `name`; description, priority, status and dueDate are optional:

```json
{
  "projectId": "<owned-project-uuid>",
  "name": "Prepare release",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-10-20"
}
```

Names/descriptions have the same rules as projects. Priority: `LOW`, `MEDIUM`, `HIGH` (default `MEDIUM`). Status: `PENDING`, `IN_PROGRESS`, `COMPLETED` (default `PENDING`). Due date is an optional date-only value or null and need not fall inside project scheduling dates.

PUT updates supplied fields, including `status: "COMPLETED"`. A task can move between owned projects using projectId; both the source task and destination project are checked. Required fields/enums cannot be null. Unknown properties are rejected.

Task response data: `id`, `projectId`, `name`, `description`, `priority`, `status`, `dueDate`, `createdAt`, `updatedAt`.

All filters combine with AND: `GET /api/tasks?projectId=<uuid>&search=release&status=PENDING&priority=HIGH`.

Search is a case-insensitive literal name substring; `%` and `_` are escaped. Invalid/unknown query parameters return 400. A task project filter that matches no owned project returns an empty array, including foreign-owned project UUIDs. Lists are ordered by creation time descending with an ID tie-breaker; pagination is deferred.

## Dashboard

Response data contains numeric `totalProjects`, `totalTasks`, `completedTasks`, `pendingTasks`, `projectsInProgress`. Pending counts only `PENDING`, excluding `IN_PROGRESS`. All values are scoped to the authenticated user. Clients see committed cross-platform changes on refresh through these same endpoints.
