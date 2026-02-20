---
description: "Task list for QR-Based Attendance & Payroll System"
---

# Tasks: QR-Based Attendance & Payroll System

**Input**: Design documents from `/specs/001-qr-attendance-payroll/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.yaml ✅

**Tests**: Test tasks are included per phase to satisfy the ≥70% coverage gate (Constitution §III).
Write tests FIRST within each user story phase and confirm they FAIL before implementing.

**Organization**: Tasks grouped by user story → enables independent implementation, test, and demo of each story.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (touches different files, no in-phase dependency)
- **[Story]**: Which user story (US1–US4)
- All file paths are relative to repository root

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Web dashboard**: `web/src/`, `web/tests/`
- **Mobile**: `android/lib/`, `android/test/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create all three project skeletons and configure cloud services before any logic is written.

- [X] T001 Initialize backend/ Node.js + TypeScript project: `npm init`, install express, mongoose, zod, jsonwebtoken, bcryptjs, helmet, cors, morgan, dotenv, pdfkit, json2csv, node-cron, uuid + dev deps (ts-node-dev, jest, supertest, @types/*) in `backend/package.json`, `backend/tsconfig.json` (strict), `backend/jest.config.ts`, `backend/.env.example`
- [X] T002 [P] Initialize web/ Vite + React + TypeScript project: `npm create vite@latest`, install react-router-dom, axios, zustand, react-query, @types/* + ESLint + React Testing Library in `web/package.json`, `web/tsconfig.json` (strict), `web/vite.config.ts`, `web/.env.example`
- [X] T003 [P] Initialize android/ Flutter project: run `flutter create android`, add all packages to `android/pubspec.yaml` (flutter_riverpod, dio, mobile_scanner, geolocator, flutter_secure_storage, hive, hive_flutter, connectivity_plus, permission_handler, go_router, intl, uuid)
- [ ] T004 [P] Configure MongoDB Atlas M0 cluster: create free cluster at cloud.mongodb.com, create DB user, allow network access, copy `mongodb+srv://...` connection string into `backend/.env` as `MONGODB_URI`; generate two 64-byte hex secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [X] T005 [P] Configure ESLint + Prettier for backend in `backend/.eslintrc.json` and `backend/.prettierrc` (TypeScript strict rules, `@typescript-eslint/recommended`)
- [X] T006 [P] Configure ESLint + Prettier for web in `web/.eslintrc.json` and `web/.prettierrc` (react-hooks, @typescript-eslint/recommended, jsx-a11y)
- [X] T007 [P] Add Android runtime permissions (FINE_LOCATION, COARSE_LOCATION, CAMERA) to `android/android/app/src/main/AndroidManifest.xml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend data layer, auth infrastructure, and Flutter auth/navigation scaffold.
**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Backend Foundation

- [X] T008 Implement Zod env validation (parse `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, `FRONTEND_URL`, `TZ`) in `backend/src/config/env.ts`
- [X] T009 Implement MongoDB connection function (mongoose.connect with retry on failure, log connection status) in `backend/src/config/database.ts`
- [X] T010 [P] Create Employee Mongoose schema + TypeScript interface (fields: name, email, passwordHash, role, status, workplaceId, timestamps) with unique email index in `backend/src/models/Employee.ts`
- [X] T011 [P] Create Workplace Mongoose schema (name, location GeoJSON Point, geofenceRadiusMetres, qrCodeToken, timestamps) with unique qrCodeToken index and 2dsphere index on location in `backend/src/models/Workplace.ts`
- [X] T012 [P] Create AttendanceRecord Mongoose schema (employeeId, workplaceId, date, checkInAt, checkOutAt, status, regularHours, overtimeHoursMorning, overtimeHoursEvening, isManuallyAdjusted, adjustmentNote, adjustedBy, adjustedAt, deviceCheckInAt, deviceCheckOutAt, checkInLocation, timestamps) with unique compound index `{ employeeId, date }` in `backend/src/models/AttendanceRecord.ts`
- [X] T013 [P] Create PaySheet Mongoose schema (generatedBy, generatedAt, periodStart, periodEnd, employeeIds, entries array, totals object, status, timestamps) in `backend/src/models/PaySheet.ts`
- [X] T014 [P] Create RefreshToken Mongoose schema (employeeId, tokenHash, expiresAt, userAgent, ipAddress, createdAt) with TTL index on expiresAt (7 days) and unique tokenHash index in `backend/src/models/RefreshToken.ts`
- [X] T015 [P] Create dateUtils: `toUTC`, `getDateString` (YYYY-MM-DD), `setTimeOnDate`, `roundToHalfHour` in `backend/src/utils/dateUtils.ts`
- [X] T016 Implement AuthService: `hashPassword`, `comparePassword` (bcrypt), `signAccessToken` (15 min), `signRefreshToken` (7 days), `verifyAccessToken`, `verifyRefreshToken`, `storeRefreshToken`, `revokeRefreshToken` in `backend/src/services/auth.service.ts`
- [X] T017 [P] Implement `authenticate` JWT middleware (verify Bearer token, attach `req.employee`) in `backend/src/middleware/authenticate.ts`
- [X] T018 [P] Implement `authorize(roles)` middleware (check `req.employee.role`, return 403 if not allowed) in `backend/src/middleware/authorize.ts`
- [X] T019 [P] Implement `validate(schema)` Zod middleware (parse req.body/params/query, return 400 with field errors) in `backend/src/middleware/validate.ts`
- [X] T020 Implement global error handler middleware (catch-all: log error, return JSON `{ code, message }`, never leak stack traces in production) in `backend/src/middleware/errorHandler.ts`
- [X] T021 Implement auth routes: `POST /api/auth/login` (validate email+password, return accessToken + set HttpOnly refresh cookie), `POST /api/auth/refresh`, `POST /api/auth/logout` in `backend/src/routes/auth.routes.ts`
- [X] T022 Create Express app: register helmet, cors (FRONTEND_URL origin), morgan JSON, express.json, all route modules, errorHandler; call `connectDatabase()` on startup in `backend/src/index.ts`
- [X] T023 Create seed script: create one Workplace document (name "Main Office", placeholder coordinates, 100 m geofence, UUID qrCodeToken) and one admin employee (email `admin@company.com`, password `Admin1234!`) in `backend/src/scripts/seed.ts`

### Flutter Foundation

- [X] T024 Configure Riverpod ProviderScope root, MaterialApp theme (brand colors), and route guard logic in `android/lib/main.dart`
- [X] T025 [P] Create AppConfig with `apiBaseUrl` (emulator default `http://10.0.2.2:3000/api`), pay rate constants (`regularDayRate: 1000`, `overtimeRatePerHour: 160`, `regularStartHour: 8`, `regularEndHour: 17`) in `android/lib/core/constants/api_constants.dart`
- [X] T026 Create Dio API client: add `AuthInterceptor` that injects `Authorization: Bearer <accessToken>` on every request and transparently refreshes token on 401 (calls `/auth/refresh`, retries original request once) in `android/lib/core/network/dio_client.dart`
- [ ] T027 [P] Create SecureStorage wrapper: `saveAccessToken`, `saveRefreshToken`, `getAccessToken`, `getRefreshToken`, `clearAll` using `flutter_secure_storage` in `android/lib/core/storage/secure_storage.dart`
- [ ] T028 [P] Create ConnectivityService: stream of `bool isOnline` using `connectivity_plus`, expose `onReconnect` stream for offline queue flush trigger in `android/lib/core/network/connectivity_service.dart`
- [X] T029 [P] Create Dart model classes: `EmployeeModel`, `WorkplaceModel`, `AttendanceRecordModel`, `AttendanceSummaryModel` with `fromJson`/`toJson` in `android/lib/features/auth/models/` and `android/lib/features/attendance/models/`
- [X] T030 Create AuthRepository: `login(email, password)` → POST `/api/auth/login`, save tokens; `logout()` → POST `/api/auth/logout`, clear tokens in `android/lib/features/auth/repositories/auth_repository.dart`
- [X] T031 Create AuthNotifier (Riverpod `AsyncNotifier<AuthState>`): states `AuthLoading`, `AuthAuthenticated(employee)`, `AuthUnauthenticated`; expose `login`, `logout` methods; auto-restore on app start in `android/lib/features/auth/providers/auth_provider.dart`
- [X] T032 Build LoginScreen: email + password `TextFormField`, form validation (non-empty, email format), submit button calls `authProvider.login()`, show error SnackBar on failure in `android/lib/features/auth/screens/login_screen.dart`
- [X] T033 Configure go_router: route `/` guards to LoginScreen if `AuthUnauthenticated`, to HomeScreen if `AuthAuthenticated`; add `/scanner` route in `android/lib/core/router/app_router.dart`
- [ ] T034 [P] Create `PermissionUtils.requestAll()`: request FINE_LOCATION and CAMERA permissions using `permission_handler`; return `bool allGranted` in `android/lib/core/utils/permission_utils.dart`

**Checkpoint**: Foundation ready — run `npm run dev` in `backend/`, verify auth endpoints work via curl or Postman, then run `flutter run` and confirm login screen appears.

---

## Phase 3: User Story 1 — Employee Check-In (Priority: P1) 🎯 MVP

**Goal**: Employee can arrive at workplace, see Check In button enabled (geofence), scan QR code, and have check-in recorded in the database.

**Independent Test**: Create a test employee via seed/admin, mock GPS to inside the geofence, tap Check In, scan the QR code shown in the backend seed output; confirm `GET /api/attendance/today` returns a closed record with correct employee ID and timestamp.

### Tests for US1 ⚠️ Write FIRST — confirm they FAIL before implementing T037–T043

- [ ] T035 [P] [US1] Write unit test: `GeofenceService.validateQrToken` returns workplace on valid token, throws on invalid token in `backend/tests/unit/geofence.service.test.ts`
- [ ] T036 [P] [US1] Write unit test: `AttendanceService.checkIn` returns 409 error when called twice for same employee + date in `backend/tests/unit/attendance.service.test.ts`


### Backend — US1

- [X] T037 [US1] Implement GeofenceService: `lookupWorkplaceByQrToken(token)` → query Workplace by qrCodeToken, throw 400 if not found in `backend/src/services/geofence.service.ts`
- [X] T038 [US1] Implement `AttendanceService.checkIn(employeeId, qrToken, deviceTimestamp, location)`: validate QR token, check no open record for today (`{ employeeId, date }` unique), create AttendanceRecord (status: `open`, server timestamp), return record in `backend/src/services/attendance.service.ts`
- [X] T039 [US1] Implement attendance routes: `GET /api/attendance/today` (return today's record for auth employee), `POST /api/attendance/checkin` (validate body with Zod, call `checkIn` service) in `backend/src/routes/attendance.routes.ts`; register route in `backend/src/index.ts`

### Flutter — US1

- [X] T040 [P] [US1] Create WorkplaceProvider: fetch workplace config from `GET /api/admin/workplace` on first load, cache geofence coordinates + radius in Riverpod state in `android/lib/features/geofence/providers/geofence_provider.dart`
- [X] T041 [P] [US1] Create GeofenceProvider: watch GPS position via `geolocator`, compute `Geolocator.distanceBetween()` against workplace coordinates, expose `bool isWithinGeofence` in `android/lib/features/geofence/providers/geofence_provider.dart`
- [X] T042 [US1] Create AttendanceRepository: `getTodayRecord()` → GET `/api/attendance/today`; `checkIn(qrToken, location)` → POST `/api/attendance/checkin` in `android/lib/features/attendance/repositories/attendance_repository.dart`
- [X] T043 [US1] Create AttendanceNotifier (Riverpod AsyncNotifier): load today's record on init, expose `checkIn(qrToken)` action, update state on success in `android/lib/features/attendance/providers/attendance_provider.dart`
- [X] T044 [US1] Build QrScanScreen: full-screen `MobileScannerController` camera view, overlay QR frame guide, on scan → calls checkIn/checkOut in `android/lib/features/attendance/screens/scanner_screen.dart`
- [X] T045 [US1] Build HomeScreen: show today's record status, Check In `ElevatedButton` enabled only when `isWithinGeofence && record == null`, tap → navigates to ScannerScreen, show success confirmation in `android/lib/features/home/screens/home_screen.dart`

### Tests for US1 (continued)

- [ ] T046 [P] [US1] Write integration test: `POST /api/attendance/checkin` → 201 with record; second call → 400 duplicate in `backend/tests/integration/attendance.test.ts`
- [ ] T047 [P] [US1] Write Flutter unit test: `GeofenceProvider` returns `true` when distance < radius, `false` when > radius in `android/test/unit/geofence_provider_test.dart`
- [ ] T048 [P] [US1] Write Flutter widget test: `HomeScreen` Check In button is disabled when `isWithinGeofence = false` in `android/test/widget/home_screen_test.dart`

**Checkpoint US1**: `POST /api/attendance/checkin` returns 201 ✅ | Flutter app shows enabled Check In button inside geofence ✅ | QR scan submits and confirmation appears ✅

---

## Phase 4: User Story 2 — Employee Check-Out (Priority: P1)

**Goal**: Employee can check out at end of day; record closes with pay calculation; offline events sync automatically.

**Independent Test**: After a check-in, run the app, tap Check Out, scan QR; verify `GET /api/attendance/today` returns status `closed` with `regularHours`, `overtimeHoursMorning`, `overtimeHoursEvening` fields populated; turn off network, check in again next test day, restore network, verify event syncs.

### Tests for US2 ⚠️ Write FIRST — confirm they FAIL before implementing T054–T058

- [X] T049 [P] [US2] Write unit tests for `PayrollService.calculatePay()`: case 09:00–16:00 → Rs 1000 + Rs 0 OT; case 07:30–18:00 → Rs 1000 + Rs 80 morning + Rs 160 evening = Rs 1240; case 06:00–07:30 → Rs 0 regular + Rs 1.5×Rs160 = Rs 240 in `backend/tests/unit/payroll.service.test.ts`

### Backend — US2

- [X] T050 [US2] Implement `PayrollService.calculatePay(checkInAt, checkOutAt)`: overlap with [08:00, 17:00] → `regularHours`; time before 08:00 → `overtimeHoursMorning`; time after 17:00 → `overtimeHoursEvening`; round OT to nearest 30 min; `regularPay = regularHours > 0 ? 1000 : 0`; `overtimePay = (morning + evening) × 160`; return full breakdown in `backend/src/services/payroll.service.ts`
- [X] T051 [US2] Implement `AttendanceService.checkOut(employeeId, qrToken, deviceTimestamp, location)`: find open record by `{ employeeId, date }`, validate QR, set `checkOutAt` to server time, call `PayrollService.calculatePay`, set status to `closed`, save and return updated record with summary in `backend/src/services/attendance.service.ts`
- [X] T052 [US2] Add `POST /api/attendance/checkout` route in `backend/src/routes/attendance.routes.ts` (validate body, call `checkOut` service, return record + summary)
- [X] T053 [US2] Add `POST /api/attendance/sync` route: iterate events array in order, call `checkIn` or `checkOut` per event type, collect results with `localId` → status `synced` / `conflict` / `error` in `backend/src/routes/attendance.routes.ts`
- [X] T054 [US2] Implement midnight incomplete cron job: `node-cron` schedule `'5 0 * * *'`, query all AttendanceRecords with `status: 'open'` and `date < today`, update to `status: 'incomplete'`, register in `backend/src/index.ts` in `backend/src/scripts/markIncomplete.ts`

### Flutter — US2

- [X] T055 [US2] Create OfflineQueue: Hive box (`offline_queue`), `enqueue(event)` → store OfflineEvent with localId, type, qrToken, timestamp, location; auto-flush on reconnect in `android/lib/features/offline_queue/models/offline_event.dart` + `android/lib/features/offline_queue/providers/sync_provider.dart`
- [X] T056 [US2] Offline sync via SyncService: wrap attendance calls in try/catch; on network error → enqueue event; `_flush()` method → POST `/api/attendance/sync` with all pending events, clears queue on success in `android/lib/features/offline_queue/providers/sync_provider.dart`
- [X] T057 [US2] SyncService listens to connectivity changes via `connectivity_plus`, auto-flushes queue when online; HomeScreen shows `pendingCount` chip in `android/lib/features/home/screens/home_screen.dart`
- [ ] T058 [US2] Build SummaryScreen: display formatted daily breakdown (check-in time, check-out time, total worked, regular hours, morning OT, evening OT, estimated pay) after checkout in `android/lib/features/attendance/screens/summary_screen.dart`
- [X] T059 [US2] HomeScreen shows Check Out button when `record.status == 'open'`; Pending Sync chip when offline events pending; Check Out navigates to ScannerScreen in `android/lib/features/home/screens/home_screen.dart`

### Tests for US2 (continued)

- [ ] T060 [P] [US2] Write integration test: `POST /api/attendance/checkout` for existing open record → 200 with `status: closed` and pay fields in `backend/tests/integration/attendance.test.ts`

**Checkpoint US2**: Check-out closes record with correct pay ✅ | SummaryScreen shows breakdown ✅ | Offline queue survives network loss and syncs ✅

---

## Phase 5: User Story 3 — Owner Attendance Dashboard (Priority: P2)

**Goal**: Owner logs into React web app, sees real-time attendance overview, views history, manually closes incomplete records, and manages employee accounts.

**Independent Test**: Seed 3 employee records (one open, one closed, one incomplete), log into React dashboard, confirm all three appear in the overview with correct statuses; manually close the incomplete record; verify the audit log entry is created.

### Tests for US3 ⚠️ Write FIRST — confirm they FAIL before implementing T066–T081

- [ ] T061 [P] [US3] Write integration test: `GET /api/admin/attendance/today` returns overview with correct `displayStatus` for each employee in `backend/tests/integration/attendance.test.ts`
- [ ] T062 [P] [US3] Write React component test: `DashboardPage` renders employee status cards from mocked API response in `web/tests/components/DashboardPage.test.tsx`

### Backend — US3 Admin Routes

- [X] T063 [US3] Implement `GET /api/admin/attendance/today`: query all active employees + their today's record (or null), compute `displayStatus` (`checked_in` / `checked_out` / `absent` / `incomplete`) in `backend/src/routes/admin/attendance.routes.ts`
- [X] T064 [P] [US3] Implement `GET /api/admin/attendance` with query params (`employeeId`, `startDate`, `endDate`, `status`): filter AttendanceRecords, return paginated list in `backend/src/routes/admin/attendance.routes.ts`
- [X] T065 [P] [US3] Implement `PATCH /api/admin/attendance/:id/close`: validate `checkOutAt` + `adjustmentNote` (min 10 chars), call `AttendanceService.adminClose()` (calculate pay, set `isManuallyAdjusted: true`, log `adjustedBy`, `adjustedAt`) in `backend/src/routes/admin/attendance.routes.ts`
- [X] T066 [US3] Implement employee admin routes: `GET /api/admin/employees` (filter by status/workplaceId), `POST /api/admin/employees` (create + bcrypt password), `PUT /api/admin/employees/:id` (update name/role/workplace), `PATCH /api/admin/employees/:id/status` (active/inactive) in `backend/src/routes/admin/employees.routes.ts`
- [X] T067 [US3] Register `admin/attendance.routes` and `admin/employees.routes` with `authenticate` + `authorize('admin')` middleware in `backend/src/index.ts`

### React Foundation (needed for all US3+ pages)

- [X] T068 [P] [US3] Define TypeScript API types matching `contracts/api.yaml` schemas (Employee, AttendanceRecord, Paysheet, Workplace, etc.) in `web/src/types/api.types.ts`
- [X] T069 [US3] Create Axios API client: `baseURL` from `VITE_API_BASE_URL`, request interceptor adds `Authorization: Bearer <token>`, response interceptor handles 401 → call refresh endpoint → retry once; on second 401 → logout in `web/src/services/apiClient.ts`
- [X] T070 [US3] Create authService: `login(email, password)` → POST `/api/auth/login`; `refreshToken()` → POST `/api/auth/refresh`; `logout()` → POST `/api/auth/logout` in `web/src/services/authService.ts`
- [X] T071 [US3] Create Zustand authStore: `employee`, `accessToken`, `isAuthenticated`, `login(credentials)`, `logout()`, persist token to sessionStorage in `web/src/store/authStore.ts`
- [X] T072 [US3] Build LoginPage: email + password form, submit → `authStore.login()`, redirect to `/dashboard` on success, show error message on failure in `web/src/pages/LoginPage.tsx`
- [X] T073 [US3] Set up React Router v6: routes `/login`, `/dashboard`, `/attendance`, `/employees`, `/paysheets`, `/settings`; wrap all non-login routes in `ProtectedRoute` component (redirect to `/login` if not authenticated) in `web/src/App.tsx`

### React Dashboard — US3

- [X] T074 [US3] Create attendanceService: `getTodayOverview()`, `queryHistory(params)`, `manualClose(id, body)` in `web/src/services/attendanceService.ts`
- [X] T075 [US3] Create employeeService: `listEmployees(params)`, `createEmployee(body)`, `updateEmployee(id, body)`, `setEmployeeStatus(id, status)` in `web/src/services/employeeService.ts`
- [X] T076 [P] [US3] Build `EmployeeStatusCard` component: display name, status badge (colour-coded), check-in time, checkout time in `web/src/components/EmployeeStatusCard.tsx`
- [X] T077 [P] [US3] Build `AttendanceTable` component: sortable table (employee, date, check-in, check-out, regular hrs, OT hrs, status badge, action button for incomplete rows) in `web/src/components/AttendanceTable.tsx`
- [X] T078 [P] [US3] Build `ManualCloseModal` component: date-time picker for `checkOutAt`, required textarea for `adjustmentNote`, submit → call `attendanceService.manualClose()` in `web/src/components/ManualCloseModal.tsx`
- [X] T079 [US3] Build DashboardPage: fetch today's overview every 30 seconds, display `EmployeeStatusCard` grid, show count badges (present / absent / incomplete) in `web/src/pages/DashboardPage.tsx`
- [X] T080 [US3] Build AttendancePage: date range filter → `AttendanceTable`; clicking incomplete row opens `ManualCloseModal` in `web/src/pages/AttendancePage.tsx`
- [X] T081 [US3] Build EmployeesPage: employee list table; "Add Employee" inline form (name, email, password); toggle active/inactive in `web/src/pages/EmployeesPage.tsx`
- [X] T082 [US3] Build `Sidebar` navigation component: links to Dashboard, Attendance, Employees, Paysheets, Settings; show active route highlight; logout button in `web/src/components/Sidebar.tsx`

**Checkpoint US3**: Owner logs in ✅ | Today's overview shows all employees ✅ | History query + filter works ✅ | Manual close saves with audit log ✅ | Employee CRUD works ✅

---

## Phase 6: User Story 4 — Owner Generates Pay Sheet (Priority: P3)

**Goal**: Owner selects employees + date range, generates paysheet with Rs 1,000/day regular + Rs 160/hr overtime, exports as PDF and CSV.

**Independent Test**: Seed known attendance records (e.g., employee worked 07:30–18:00 for 5 days), generate a paysheet, verify total = 5 × Rs 1,240 = Rs 6,200; export as PDF and CSV and confirm both download.

### Tests for US4 ⚠️ Write FIRST — confirm they FAIL before implementing T087–T094

- [ ] T083 [P] [US4] Write unit tests for `PayrollService.generatePaysheet()`: verify Rs 1,240 on a 07:30–18:00 day; verify incomplete days are skipped and flagged in `backend/tests/unit/payroll.service.test.ts`
- [ ] T084 [P] [US4] Write integration test: `POST /api/admin/paysheets/generate` returns paysheet with correct totals and `skippedDays` count in `backend/tests/integration/paysheets.test.ts`

### Backend — US4

- [X] T085 [US4] Implement `PayrollService.generatePaysheet(periodStart, periodEnd, employeeIds)`: query all AttendanceRecords in date range for selected employees; call `calculatePay` for each `closed` record; mark `incomplete` records as `skipped_incomplete`; aggregate totals; create and save PaySheet document in `backend/src/services/payroll.service.ts`
- [X] T086 [P] [US4] Implement `ExportService.toPDF(paysheet)`: generate PDF with pdfkit (header: company/period, table: employee rows, per-day breakdown, totals, footer: generated date) in `backend/src/services/export.service.ts`
- [X] T087 [P] [US4] Implement `ExportService.toCSV(paysheet)`: generate CSV with json2csv (columns: Employee, Date, Check-In, Check-Out, Regular Hrs, OT Morning, OT Evening, Regular Pay, OT Pay, Total Pay) in `backend/src/services/export.service.ts`
- [X] T088 [US4] Implement paysheet admin routes: `POST /api/admin/paysheets/generate`, `GET /api/admin/paysheets/:id`, `PATCH /api/admin/paysheets/:id` (mark processed), `GET /api/admin/paysheets/:id/export?format=pdf|csv` in `backend/src/routes/admin/paysheets.routes.ts`
- [X] T089 [US4] Register paysheet admin routes with `authenticate` + `authorize('admin')` in `backend/src/index.ts`

### React — US4

- [X] T090 [US4] Create paySheetsService: `generate(body)`, `getById(id)`, `markProcessed(id)`, `exportPaysheet(id, format)` → triggers file download via Blob URL in `web/src/services/paySheetsService.ts`
- [X] T091 [P] [US4] Build `PaysheetTable` component: table with rows per employee-day (employee, date, check-in, check-out, regular hrs, OT, regular pay, OT pay, total pay); column total row in `web/src/components/PaysheetTable.tsx`
- [X] T092 [US4] Build PaysheetPage: multi-select employee checkboxes + date-range picker; "Generate Paysheet" button → call `paySheetsService.generate()` → display `PaysheetTable`; "Export PDF" and "Export CSV" buttons trigger file downloads; "Mark as Processed" button in `web/src/pages/PaysheetPage.tsx`

**Checkpoint US4**: Paysheet generates with correct calculations ✅ | Skipped incomplete days flagged ✅ | PDF and CSV download ✅

---

## Phase 7: Workplace Settings & QR Management

**Purpose**: Owner can configure the workplace location (used by Flutter geofence) and view/rotate the QR code.

- [X] T093 Implement `GET /api/admin/workplace` and `PUT /api/admin/workplace` (update name, location, geofenceRadius) in `backend/src/routes/admin/workplace.routes.ts`
- [X] T094 [P] Implement `GET /api/admin/workplace/qr`: generate QR PNG from qrCodeToken using the `qrcode` npm package, return `image/png` buffer in `backend/src/routes/admin/workplace.routes.ts`
- [X] T095 [P] Implement `POST /api/admin/workplace/qr/rotate`: generate new UUID v4 as `qrCodeToken`, update Workplace document, return success message in `backend/src/routes/admin/workplace.routes.ts`
- [X] T096 Register workplace admin routes in `backend/src/index.ts`
- [X] T097 Create workplaceService: `getWorkplace()`, `updateWorkplace(body)`, `getQrImageUrl()`, `rotateQr()` in `web/src/services/workplaceService.ts`
- [X] T098 [P] Build `QRCodeDisplay` component: render `<img>` from QR endpoint URL; "Rotate QR Code" button (with confirmation dialog) in `web/src/components/QRCodeDisplay.tsx`
- [X] T099 Build SettingsPage: two sections — "Workplace Configuration" (name, lat, lng, geofence radius inputs, "Save" button) and "QR Code" (`QRCodeDisplay` component) in `web/src/pages/SettingsPage.tsx`

**Checkpoint Phase 7**: Owner sets workplace GPS coordinates ✅ | QR code PNG downloads/prints ✅ | QR rotation invalidates old code ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Observability, deployment, and quality gates across all three components.

- [ ] T100 [P] Add Firebase Crashlytics: add `firebase_crashlytics` to `android/pubspec.yaml`, configure `google-services.json`, wrap `runApp` with `FlutterError.onError` → `FirebaseCrashlytics.instance.recordFlutterFatalError` in `android/lib/main.dart`
- [ ] T101 [P] Configure Morgan structured JSON logging (log `employee_id`, `event_type`, `timestamp`, `source_platform`, `request_ip` on attendance routes) and add `TZ=UTC` env var in `backend/src/index.ts`
- [ ] T102 [P] Harden CORS: restrict `cors()` to `FRONTEND_URL` origin only; add `Content-Security-Policy` via Helmet configuration in `backend/src/index.ts`
- [X] T103 [P] Configure Render.com deployment: add `backend/render.yaml` with `buildCommand: npm ci && npm run build`, `startCommand: node dist/index.js`, all env vars configured
- [X] T104 [P] Configure Vercel deployment: add `web/vercel.json` with SPA rewrite rule (`{ "source": "/(.*)", "destination": "/index.html" }`)
- [ ] T105 Update `android/lib/core/config/app_config.dart` with production `apiBaseUrl` pointing to the deployed Render.com URL (use `const String.fromEnvironment` or a build flavor)
- [ ] T106 [P] Run `flutter analyze` in `android/` — resolve all warnings/errors to zero (Constitution §II gate)
- [ ] T107 [P] Run `npm run lint` + `tsc --noEmit` in `backend/` — resolve all ESLint and TypeScript errors to zero
- [ ] T108 [P] Run `npm run lint` + `tsc --noEmit` in `web/` — resolve all ESLint and TypeScript errors to zero
- [ ] T109 [P] Write Flutter widget test for SummaryScreen renders correct regular + overtime breakdown in `android/test/widget/summary_screen_test.dart`
- [ ] T110 [P] Write React hook test for `useAuth` login and logout state transitions in `web/tests/unit/useAuth.test.ts`
- [ ] T111 Run quickstart.md end-to-end validation: seed DB → start backend → start web → run Flutter on emulator → check in → check out → view dashboard → generate paysheet → export CSV

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundation (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 Check-In (Phase 3)**: Depends on Foundation — no dependency on US2, US3, US4
- **US2 Check-Out (Phase 4)**: Depends on Foundation + US1 (check-out requires an open check-in record)
- **US3 Dashboard (Phase 5)**: Depends on Foundation — can start in parallel with US1/US2 once Foundation is done
- **US4 Paysheet (Phase 6)**: Depends on US2 (payroll service) + US3 (React app foundation)
- **Phase 7 Settings**: Depends on Foundation only — can run in parallel with US3/US4
- **Polish (Phase 8)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation → US1 — fully independent
- **US2 (P1)**: Foundation → US2 (also depends on US1 being testable for end-to-end flow)
- **US3 (P2)**: Foundation → US3 — independent from US1/US2 (uses same attendance data)
- **US4 (P3)**: Foundation + US2 payroll service + US3 React app foundation → US4

### Within Each Phase

- Tests MUST be written first (red → green → refactor)
- Backend models before services → services before routes
- Flutter providers before screens
- React services before pages

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006, T007 all run in parallel alongside T001
- **Phase 2 Backend models**: T010, T011, T012, T013, T014, T015 run in parallel after T009
- **Phase 2 Middleware**: T017, T018, T019 run in parallel after T016
- **Phase 2 Flutter**: T025, T027, T028, T029, T032, T034 run in parallel after T024
- **Phase 3**: T040, T041 (Flutter geofence + workplace providers) run in parallel; T035, T036 test tasks run in parallel
- **Phase 5**: T063, T064, T065 backend admin routes run in parallel; T076, T077, T078 React components run in parallel

---

## Implementation Strategy

### MVP First — US1 + US2 Only (Phases 1–4)

1. Complete Phase 1 (Setup) and Phase 2 (Foundation)
2. Complete Phase 3 (US1 Check-In) — **STOP and VALIDATE**
3. Complete Phase 4 (US2 Check-Out) — **STOP and VALIDATE**
4. **Demo**: Employee can check in and out; records in MongoDB Atlas confirmed

### Incremental Delivery

1. Foundation ready → Employee mobile flow working (US1 + US2)
2. Add React dashboard (US3) → Owner can monitor attendance
3. Add paysheet generation (US4) → Owner can calculate wages
4. Add settings/QR management (Phase 7) → Full admin control
5. Polish + deploy → Production-ready system

### Parallel Team Strategy

With two developers:

- **Developer A (Backend)**: Phases 1 (backend) → 2 (backend) → 3–4 (backend) → 5–6 (backend)
- **Developer B (Flutter + React)**: Phases 1 (mobile + web) → 2 (Flutter) → 3–4 (Flutter) → 5–6 (React)

Backend and mobile work can proceed in parallel once Foundation models are complete.

---

## Notes

- `[P]` = different files, safe to run in parallel within the same phase
- `[USx]` = maps to user story for traceability
- Server timestamp is always authoritative — device clock is for audit only
- Offline queue `localId` (UUID) prevents duplicates on re-sync
- Geofence check is done on the mobile client; QR token validation is on the server
- Pay calculation constants live in `AppConfig` (mobile) and `PAY_RATES` (backend) — change both together if rates change
- All monetary values stored as numbers (Rs) not strings
- All timestamps stored and transmitted as UTC ISO 8601
