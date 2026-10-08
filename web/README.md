# ISMO web application

React + TypeScript + Vite frontend for the existing NestJS backend. The web app uses real /api data for authentication, projects, tasks and dashboard counts. It preserves the supplied Stitch Bauhaus palette, typography, fixed sidebar, geometric decorations, project cards, task rows and detail layout. Unsupported demo features and data are excluded.

## Run locally

Use Node.js 22 or 24. Start the database and backend using the root README, including explicit migrations. Then:

    cd web
    cp .env.example .env
    npm install
    npm run dev

Open http://localhost:3000. Vite forwards /api requests to http://127.0.0.1:3001 by default. Set WEB_PROXY_TARGET when the backend uses another address or port. Local settings stay in ignored .env files. The proxy preserves the single backend and is development tooling, not an additional backend.

## Production

    npm run build

Serve dist/ as static files. Configure the web host to send browser routes such as /projects/:id to index.html and proxy /api to the existing backend. Alternatively, set VITE_API_BASE_URL to the public backend URL ending in /api before building and allow the exact web origin in the backend CORS_ORIGINS. All VITE_* settings are public build values; never put database credentials or signing secrets there. Use HTTPS.

## Behavior

- Login tokens and expiry persist in localStorage; the backend verifies the current user before protected pages appear. Logout revokes the real server session. Invalid or expired sessions clear local data and return to sign-in.
- Browser storage restrictions fall back to an in-memory session. Query caches clear when the account changes or signs out.
- Light/dark preference persists and is applied before React starts to avoid a theme flash. Both themes keep the cream, black, yellow, red and cobalt identity.
- Project/task forms send only supported editable fields. Empty descriptions/dates become null. Created dates use backend createdAt.
- Project status stays explicitly managed. Completion rings show completed tasks divided by total tasks from the real task list, and do not change project status.
- Search is a debounced, literal name search through backend query parameters. Status/priority/project filters combine. Lists follow the backend creation order.
- All deletion actions require confirmation; project deletion warns about the task cascade.
- Queries refresh on navigation after mutations and browser focus. No polling, invented analytics, mock data, mobile app or extra backend is included.

## Verify

    npm run lint
    npm run typecheck
    npm run build
    npx playwright install chromium
    npm test

Playwright needs the migrated PostgreSQL database and backend dependencies/build. Its configuration starts the compiled backend and web preview (or reuses existing servers locally). Supply the documented backend environment variables when invoking tests. Use an isolated test database: the suite creates test accounts and records and intentionally exercises destructive deletion on those records. Do not target production data.

The GitHub Actions workflow supplies ephemeral PostgreSQL and a randomly generated test signing key. It verifies registration/login/logout, persistence, real dashboard counts, project/task CRUD and relationships, filters, task movement, cascading deletion, network retry, invalid/expired sessions, keyboard dialog behavior, themes, accessibility and responsive overflow. Screenshots and the browser report are retained as workflow artifacts.

## Structure

- src/auth: session restoration, protected routing and expiration.
- src/lib: typed backend client, query hooks, date formatting and persistence.
- src/components: shell, themes, dialogs, states and toast feedback.
- src/features: project cards, task lists, filters and reusable forms.
- src/pages: dashboard, projects, project details, tasks and auth routes.
- tests: real-backend browser flows.

The assignment PDF and additional attached notes were unavailable in the failed cloud workspace; functional scope follows the pasted frontend handoff and inspected backend documentation. No backend source has been modified.
