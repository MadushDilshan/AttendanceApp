# Quickstart Guide: QR-Based Attendance & Payroll System

**Feature**: 001-qr-attendance-payroll
**Date**: 2026-02-13

This guide walks through getting all three components running for local development and
deploying them to production hosting.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Flutter SDK | 3.x stable | https://flutter.dev/docs/get-started/install |
| Dart | 3.x (bundled with Flutter) | — |
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | bundled with Node.js |
| Git | any recent | https://git-scm.com |
| Android Studio | latest stable | https://developer.android.com/studio |
| Android SDK | API 26+ (Android 8.0) | via Android Studio SDK Manager |
| MongoDB Atlas account | free | https://cloud.mongodb.com |

---

## 1. Repository Structure

```text
AttendanceApp/
├── android/          # Flutter Android app
├── backend/          # Node.js + Express + TypeScript API
├── web/              # React + TypeScript dashboard (Vite)
├── specs/            # Feature specifications (this directory)
└── .specify/         # Speckit tooling
```

---

## 2. MongoDB Atlas Setup (one-time)

1. Sign up at https://cloud.mongodb.com → create a **Free M0 cluster** (512 MB).
2. Cluster name: `attendance-cluster`, region: closest to your users.
3. Create a database user: **Security → Database Access** → Add user.
   - Username: `attendance-api`; auto-generate a secure password; save it.
4. Allow network access: **Security → Network Access** → Add IP Address → `0.0.0.0/0` for
   development (restrict to Render.com IP range in production).
5. Get your connection string: **Clusters → Connect → Drivers → Node.js**.
   Format: `mongodb+srv://attendance-api:<password>@attendance-cluster.xxxxx.mongodb.net/attendancedb`
6. Save this as `MONGODB_URI` — needed for backend `.env`.

---

## 3. Backend (Node.js + Express)

### 3.1 Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://attendance-api:<password>@...
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3.2 Run locally

```bash
npm run dev       # ts-node-dev with auto-reload
```

API available at: `http://localhost:3000/api`

### 3.3 Seed initial data (first run)

```bash
npm run seed
```

This creates:
- One workplace (name: "Main Office", geofence: 100 m, placeholder coordinates)
- One admin account: `admin@company.com` / `Admin1234!`

**Update the workplace coordinates** immediately via the React dashboard Settings screen
or via the PUT `/api/admin/workplace` endpoint.

### 3.4 Run tests

```bash
npm test          # Jest unit + integration tests
npm run test:coverage
```

---

## 4. React Web Dashboard

### 4.1 Setup

```bash
cd web
npm install
cp .env.example .env.local
```

Edit `web/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4.2 Run locally

```bash
npm run dev       # Vite dev server
```

Dashboard at: `http://localhost:5173`

Login with: `admin@company.com` / `Admin1234!`

### 4.3 Run tests

```bash
npm test          # Jest + React Testing Library
npm run lint      # ESLint + TypeScript check
```

---

## 5. Flutter Android App

### 5.1 Setup

```bash
cd android
flutter pub get
cp lib/core/config/app_config.example.dart lib/core/config/app_config.dart
```

Edit `lib/core/config/app_config.dart`:

```dart
class AppConfig {
  static const String apiBaseUrl = 'http://10.0.2.2:3000/api'; // Android emulator → localhost
  // Change to your Render.com URL for production builds
}
```

### 5.2 Run on emulator

```bash
flutter run                   # debug build
flutter analyze               # zero warnings required before commit
flutter test                  # run all tests
```

### 5.3 Run on physical device

1. Enable Developer Mode on your Android phone.
2. Enable USB Debugging.
3. Connect via USB.
4. Replace `10.0.2.2` with your machine's local IP in `app_config.dart`.
5. Run: `flutter run`

### 5.4 Grant required permissions

The app requests at first launch:
- **Location (Fine)** — geofence check
- **Camera** — QR code scanning

---

## 6. Validate the Full Flow

1. Start backend: `cd backend && npm run dev`
2. Start dashboard: `cd web && npm run dev`
3. Start Flutter app on emulator or device.
4. In the dashboard → Settings: set your workplace GPS coordinates and geofence radius.
5. In the dashboard → Employees: create an employee account.
6. Log in on the Flutter app with the employee credentials.
7. Mock your location to inside the geofence (Android Emulator → Extended Controls → Location).
8. Tap "Check In" → scan the QR code from the dashboard (Settings → QR Code).
9. Verify the record appears on the dashboard immediately.
10. Tap "Check Out" later → scan same QR.
11. In the dashboard → Paysheets: generate a paysheet and verify calculations.

---

## 7. Production Deployment

### 7.1 Deploy Backend to Render.com

1. Push code to GitHub (backend in `backend/` subdirectory).
2. Create a new **Web Service** on Render.com.
3. Connect your GitHub repo; set **Root Directory** to `backend`.
4. Build command: `npm run build`
5. Start command: `node dist/index.js`
6. Add all `.env` variables under **Environment** in Render dashboard.
7. Copy the deployed URL (e.g., `https://attendance-api.onrender.com`).

### 7.2 Deploy Dashboard to Vercel

1. Import your GitHub repo on Vercel.com.
2. Set **Root Directory** to `web`.
3. Framework preset: **Vite**.
4. Add environment variable: `VITE_API_BASE_URL=https://attendance-api.onrender.com/api`
5. Deploy. Copy the dashboard URL.

### 7.3 Update Flutter production config

Edit `lib/core/config/app_config.dart`:

```dart
static const String apiBaseUrl = 'https://attendance-api.onrender.com/api';
```

Build release APK:

```bash
flutter build apk --release
```

Distribute via direct install (APK) or publish to Google Play.

### 7.4 Post-deployment checklist

- [ ] All API calls use HTTPS (verify in browser Network tab)
- [ ] Admin password changed from seed default
- [ ] Workplace coordinates set correctly
- [ ] QR code printed and posted at workplace entrance
- [ ] At least one test check-in performed by a real employee
- [ ] Paysheet calculation verified against a known test case

---

## 8. Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Check In button always disabled | Location permission denied or GPS off | Ensure Fine Location permission granted and GPS enabled |
| QR scan not working | Camera permission denied | Grant camera permission in Android settings |
| "Pending Sync" never clears | Backend unreachable | Check backend URL in `app_config.dart` |
| 401 errors on all requests | Token expired | Log out and log in again; check `JWT_EXPIRES_IN` |
| First API call after deployment is slow | Render.com free tier cold start | Expected — first morning request may take 30 s |
| Incorrect pay calculation | Timezone issue | Ensure backend `TZ=UTC` env var is set; all timestamps stored as UTC |
