# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Three independent sub-projects share no build tooling:

```
backend/   Node.js + Express + TypeScript REST API
web/       React 18 + Vite + TypeScript admin dashboard
android/   Flutter 3.x employee mobile app
specs/     SpecKit design artifacts (spec.md, plan.md, tasks.md)
```

---

## Backend (`backend/`)

**Required `.env` variables** (validated at startup via Zod — server will not start without them):
```
MONGODB_URI=          # MongoDB Atlas connection string
JWT_SECRET=           # ≥32 chars
JWT_REFRESH_SECRET=   # ≥32 chars
FRONTEND_URL=         # e.g. http://localhost:5173 (used in CORS)
PORT=3000             # optional, defaults to 3000
NODE_ENV=development
TZ=UTC                # keep UTC; pay calc applies Sri Lanka offset internally
```

**Commands:**
```bash
cd backend
npm run dev           # ts-node-dev with hot reload
npm run build         # tsc → dist/
npm start             # run compiled dist/index.js
npm run seed          # seed admin + sample employees
npm test              # jest (all tests)
npm test -- --testPathPattern=auth   # run a single test file
npm run test:coverage
npm run lint
npm run lint:fix
```

**Debug scripts** (at `backend/` root, run with `node`):
- `get-qr-token.js` — fetch a workplace QR token for manual testing
- `check-attendance.js` — inspect raw attendance records
- `check-db.js` — verify DB connection and collection counts

**Architecture:**

Request flow: `route → validate(zodSchema) → authenticate → authorize → service → Mongoose model`

- `src/config/env.ts` — Zod-validated env; import `env` everywhere instead of `process.env`
- `src/middleware/authenticate.ts` — verifies Bearer JWT, attaches `req.employee`
- `src/middleware/authorize.ts` — RBAC; checks `req.employee.role` against allowed roles
- `src/middleware/validate.ts` — Zod body validation, returns 400 on failure
- `src/middleware/errorHandler.ts` — global error handler; mount last in `index.ts`
- `src/utils/dateUtils.ts` — shared date helpers (Sri Lanka offset, range helpers)
- `src/services/` — all business logic lives here; routes are thin
- `src/scripts/markIncomplete.ts` — cron at `00:05 UTC` marks stale `open` records as `incomplete`

**Route structure:**
- Public routes: `auth.routes.ts`, `attendance.routes.ts`, `workplace.routes.ts`
- Admin-only routes (under `src/routes/admin/`): `employees.routes.ts`, `attendance.routes.ts`, `paysheets.routes.ts`, `workplace.routes.ts` — all protected by `authorize('admin')`

**Auth flow:**
- `POST /api/auth/login` returns `accessToken` (15 min JWT) in body **and** `refreshToken` in body + HttpOnly cookie
- `POST /api/auth/refresh` accepts token from cookie (web) or request body (mobile)
- Refresh tokens are stored hashed in the `RefreshToken` collection and rotated on each use

**Attendance flow:**
- QR token is validated against the `Workplace` document via `geofence.service.ts`
- Server timestamps are used (device timestamp stored separately as `deviceCheckInAt`/`deviceCheckOutAt`)
- One open record per employee per day enforced at service layer
- `POST /api/attendance/sync` accepts an array of offline events for bulk replay

**Pay calculation** (`src/services/payroll.service.ts` → `calculatePay`):
- All times converted to Sri Lanka time (UTC+5:30) before calculation
- Regular: flat Rs 1,000/day if any overlap with 08:00–17:00 local
- Overtime: Rs 160/hr for time outside 08:00–17:00, rounded to nearest 30 min
- Constants are in `PAY_RATES` — change here **and** in `android/lib/core/constants/api_constants.dart` together

**Export** (`src/services/export.service.ts`): generates PDF and CSV paysheets using `pdfkit` and `json2csv`.

---

## Web Dashboard (`web/`)

**Commands:**
```bash
cd web
npm run dev           # Vite dev server (http://localhost:5173)
npm run build         # tsc + vite build → dist/
npm run type-check    # tsc --noEmit only
npm run lint
npm test
```

**Architecture:**

- `src/store/authStore.ts` — Zustand store; holds `accessToken` in memory (sessionStorage). On 401 the axios interceptor in `src/services/apiClient.ts` calls `/auth/refresh` once then retries.
- `src/services/apiClient.ts` — single Axios instance; all service files (`attendanceService.ts`, `employeeService.ts`, etc.) import from here
- `src/App.tsx` — React Router v6 route definitions with protected route wrapper
- Styling: **inline styles only** — no CSS framework, no CSS files, no Tailwind

---

## Flutter App (`android/`)

**Commands:**
```bash
cd android
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs   # required after any model change
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api  # emulator → localhost
flutter test
```

**Production build:**
```bash
flutter build apk --dart-define=API_BASE_URL=https://your-backend.onrender.com/api
```

**Architecture:**

Feature-based folder structure under `lib/features/`:
- `auth/` — login screen, `AuthRepository`, `AuthProvider` (Riverpod notifier with `@freezed` state)
- `attendance/` — `ScannerScreen` (mobile_scanner), `AttendanceRepository` calls `/checkin` and `/checkout`
- `geofence/` — `GeofenceProvider` uses geolocator to verify the employee is within radius before allowing QR scan
- `offline_queue/` — `OfflineEvent` (Hive model), `SyncService` (provider) listens for connectivity and flushes queue via `POST /attendance/sync`
- `home/` — `HomeScreen` shows today's status and pending offline event count

**Code generation** (Freezed + Hive + Riverpod):
- Freezed models: `*.freezed.dart` and `*.g.dart` are committed — regenerate with `build_runner`
- `offline_event.dart` uses Hive `@HiveType`/`@HiveField` annotations; adapter is auto-registered in `main.dart`
- Known: `offline_event.dart` has a duplicate `@HiveField(6)` annotation — the duplicate should be removed

**Network layer** (`lib/core/network/dio_client.dart`):
- `dioClientProvider` — single Dio instance with `_AuthInterceptor` (QueuedInterceptor)
- On 401: reads refresh token from `flutter_secure_storage`, calls `/auth/refresh`, retries original request; on failure clears all stored tokens
- `TokenStorage` static helpers are the only way to read/write tokens elsewhere in the app

---

## Deployment

| Target | Config | Notes |
|--------|--------|-------|
| Backend | `backend/render.yaml` | Health check: `GET /health` |
| Web | `web/vercel.json` | SPA rewrite rule (all paths → `index.html`) |
| Flutter | `--dart-define=API_BASE_URL=` | No hardcoded URL in source |

Seed credentials: `admin@company.com` / `Admin1234!` (run `npm run seed` in backend).
