# Assignment and submission checklist

The original assignment was supplied in chat on 8 October 2026. Workframe implements its required authentication, project/task fields and actions, five dashboard counts, search/filtering, React web client, Expo Android client and one shared NestJS/PostgreSQL backend.

## Required capabilities

| Requirement | Implementation |
| --- | --- |
| Registration/login/logout, unique email, hashed passwords | Auth module; bcrypt hashes, JWT and revocable sessions |
| Persistent sessions and expired-login feedback | Web AuthProvider and Android AuthProvider |
| Owned project CRUD and details | Projects routes and screens in both clients |
| Task CRUD, completion, status, priority and project relationship | Tasks routes and screens in both clients |
| Required dashboard counts | User-scoped GET /api/dashboard |
| Project/task name search and status/priority filters | Validated query parameters and client controls |
| Same account, backend and database across platforms | Both production clients use the Render API |
| Pull-to-refresh and cross-platform updates | Query invalidation, reconnect/focus refresh and native refresh controls |
| Secure Android token storage | Expo SecureStore; no password persistence |
| Network, loading, empty and validation states | Reusable UI and API/session error handling |
| Ownership authorization, input validation, SQL-injection protection | Owner-scoped parameterized queries and DTO validation |
| Basic authentication rate limiting | Nest throttler on authentication endpoints |
| Database schema and API documentation | database-schema.md ER diagram, api.md and Swagger |
| Deployment/setup/environment instructions | Root and client/backend READMEs, environment.md |

The integration and native/browser workflow artifacts are the evidence for tested flows. Source implementation alone does not prove every real-device or hosting scenario.

## Submission attachments

1. Public repository: https://github.com/cmasked/ISMO_Development
2. Database diagram: [database-schema.md](database-schema.md).
3. API documentation: [api.md](api.md), https://ismo-development.onrender.com/docs.
4. Setup and environment documentation: [README](../README.md), [environment.md](environment.md).
5. Web: https://ismodevelopment-web.vercel.app/. Backend: https://ismo-development.onrender.com/api.
6. Download and extract the APK artifact from the successful Android workflow. Attach app-release.apk to the submission, or host that APK at a download location accessible to the reviewer. GitHub Actions artifact downloads may require GitHub login and expire; the workflow URL alone is not a permanent public distribution link.
7. Record and attach a five-minute demonstration. The repository's screenshots and automated test reports do not replace this recording.

## Five-minute recording guide

Use a synthetic account and only test data. Install the APK first, wake the Render backend, open the deployed website, and enable Android screen mirroring (for example Android Studio Device Mirroring or scrcpy) so the recording shows both platforms.

| Time | Demonstration |
| --- | --- |
| 0:00–0:40 | Introduce Workframe; sign in on web and Android with the same test account. |
| 0:40–1:30 | On web, create a project and a task. Show its status, priority and due date. |
| 1:30–2:15 | Pull to refresh Android and show that project and task. |
| 2:15–3:00 | Edit/complete the task on Android. Refresh web and show the changed title/status and dashboard count. |
| 3:00–3:45 | Create a second task on Android. Refresh web and show it; search/filter by name, status and priority. |
| 3:45–4:30 | Change its status on web, refresh Android, and show the new status. Show dark mode if time permits. |
| 4:30–5:00 | Sign out. Show protected routes returning to sign in; summarize the shared backend/database. |

Review the recording before submission; make sure text is readable and no passwords, tokens or private hosting settings are visible.

## Optional bonuses

Included: Docker support, unit tests, integration tests, CI, client-side pagination and sorting controls.

Not included: persistent audit logs, role-based access control, refresh tokens, due-tomorrow push notifications, persisted offline task viewing, or a shared web/mobile types package. These are optional in the assignment. These additions are deferred to keep the submission focused on the required functionality.

Android can retain in-memory data while the app remains open, but this does not constitute persisted offline task viewing. Generic operation logs are not a persistent user-facing audit trail. Ownership checks are not an additional Admin/Member role system.
