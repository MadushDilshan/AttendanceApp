# Research: QR-Based Attendance & Payroll System

**Feature**: 001-qr-attendance-payroll
**Date**: 2026-02-13
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Mobile App Framework

**Decision**: Flutter 3.x (stable channel) with Dart 3.x

**Rationale**: Constitutionally fixed (Constitution §Technology Stack). Flutter provides
native Android performance, a rich widget library, excellent camera/QR scanning support,
and solid offline storage options — all critical for an attendance app.

**Key packages chosen**:
- `mobile_scanner` — QR code scanning via device camera (actively maintained, 2025 release)
- `geolocator` — GPS position + distance calculation for geofence enforcement
- `flutter_secure_storage` — encrypted storage for JWT tokens (Constitution §IV)
- `hive` + `hive_flutter` — lightweight NoSQL local storage for offline event queue (§V)
- `dio` — HTTP client with interceptors for auth headers and offline retry
- `flutter_riverpod` — state management (chosen over BLoC; simpler API, less boilerplate for
  this scale)
- `permission_handler` — runtime permissions (camera, location)
- `intl` — date/time formatting

**Alternatives considered**:
- React Native: Rejected — constitutionally fixed to Flutter.
- BLoC: Valid alternative to Riverpod; Riverpod chosen for reduced boilerplate and easier
  testing of async state.

---

## 2. Backend Framework

**Decision**: Node.js 20 LTS + Express.js 4.x written in TypeScript 5.x

**Rationale**: User specified Node.js. Express is the most mature, best-documented Node.js
framework with an enormous ecosystem. TypeScript (strict mode) is required by the constitution.

**Key packages chosen**:
- `express` + `@types/express` — HTTP server and routing
- `mongoose` 8.x — ODM for MongoDB; schema validation, typed models
- `jsonwebtoken` + `bcryptjs` — JWT auth and password hashing
- `zod` — runtime request validation (replaces express-validator; typed schemas)
- `helmet` — HTTP security headers
- `cors` — CORS middleware (restrict to known origins in production)
- `morgan` — HTTP request logging (structured output compatible with Render logs)
- `pdfkit` — PDF generation for paysheets
- `json2csv` — CSV export for paysheets
- `dotenv` — environment variable management
- `jest` + `supertest` — testing

**Alternatives considered**:
- Fastify: Faster than Express but smaller ecosystem; Express chosen for familiarity and
  library availability.
- NestJS: Too heavy for this scale; violates Simplicity principle (§VI).
- Python/FastAPI: Rejected — user specified Node.js.

---

## 3. Database

**Decision**: MongoDB Atlas — M0 Free Shared Cluster (512 MB storage)

**Rationale**: User preference for non-relational DB; MongoDB Atlas free tier provides
cloud-hosted MongoDB with automated backups, TLS encryption, and access controls — all
required by the constitution (§IV). 512 MB is sufficient for a small team's attendance
records (an attendance record is ~1 KB; 512 MB supports ~500,000 records, covering years
of operation for <100 employees).

**Schema design approach**: Document-oriented with embedded pay calculation fields on
AttendanceRecord to avoid expensive joins at paysheet generation time.

**Why not relational (MySQL)**:
- Attendance events are append-only documents with variable optional fields (adjustment
  notes, overtime breakdowns). MongoDB's flexible schema is a better fit.
- Free tier is cloud-hosted out of the box (RDS MySQL free tier expires after 12 months).
- No complex multi-table joins required for this domain.

**Alternatives considered**:
- PlanetScale (MySQL serverless): Free tier discontinued in 2024.
- Supabase (PostgreSQL): Free tier available; rejected to align with user's explicit MongoDB
  preference.
- Firebase Firestore: Viable but introduces Google vendor lock-in and more complex pricing.

---

## 4. Hosting — Backend

**Decision**: Render.com — Free Web Service tier

**Rationale**: Free tier provides 750 compute hours/month (enough for a single service),
automatic HTTPS, environment variable management, and GitHub auto-deploy. Zero upfront cost.

**Known limitation**: Free tier services sleep after 15 minutes of inactivity and have a
~30-second cold start on first request. For an attendance app used during fixed business hours,
this is acceptable — the first morning check-in may experience a short delay once.

**Upgrade path**: Render Starter tier at $7/month eliminates sleep. Recommend upgrading once
the system is in production use.

**Alternatives considered**:
- Railway: $5/month minimum (Hobby plan) after free trial credits — slightly more expensive.
- Fly.io: Free tier available; more complex setup (Docker-based).
- Heroku: No longer has a meaningful free tier.
- Vercel Serverless Functions: Cold start + stateless constraints conflict with WebSocket needs
  and long-running paysheet generation.

---

## 5. Hosting — React Web Dashboard

**Decision**: Vercel — Free Hobby tier

**Rationale**: Vercel is the leading React/Vite hosting platform. Free tier provides unlimited
static deployments, automatic HTTPS, global CDN, GitHub auto-deploy, and preview URLs per PR.
Zero cost for the dashboard.

**Alternatives considered**:
- Netlify: Equally capable; Vercel chosen for superior Vite integration.
- GitHub Pages: Free but no server-side functions; fine for a static React SPA.
- Render Static Site: Also free; Vercel preferred for DX.

---

## 6. Authentication Strategy

**Decision**: JWT (JSON Web Tokens) — access token (15 min expiry) + refresh token (7 days)

**Rationale**: Stateless; works identically for mobile app and web dashboard. Constitution §IV
mandates defined token expiry. Refresh tokens stored in:
- Mobile: `flutter_secure_storage` (encrypted Android Keystore)
- Web: `HttpOnly` cookie (Constitution §IV — never localStorage)

**Password reset**: Email-based reset link using a one-time token valid for 1 hour.
Email sent via a transactional email service (e.g., Brevo/Sendinblue — free tier up to 300
emails/day, sufficient for a small team).

---

## 7. QR Code Strategy

**Decision**: One shared QR code per workplace, encoding the workplace's unique `qrCodeToken`
(UUID). Printed and physically posted at the workplace entrance.

**Rationale**: Simpler than per-employee QR codes. Employee identity is established by the
authenticated app session (JWT), not by the QR content. The QR is a "place token" — proof that
the employee physically scanned the correct workplace QR.

**Security consideration**: The QR token is a secret UUID (256-bit entropy). If the QR is
compromised, the owner can regenerate the token from the dashboard, invalidating the old QR.

**Per-employee QR** (not chosen): Adds QR generation and distribution overhead. The geofence
already ensures physical presence; the QR confirms "at the workplace entrance" specifically.

---

## 8. Overtime Calculation Logic (Aligned with Spec A-001)

Regular shift window: **08:00 – 17:00** (9 hours)
Regular day rate: **Rs 1,000** (flat, applies when employee was present during the regular window)
Overtime rate: **Rs 160 per hour** (rounded to nearest 30 min)

**Algorithm**:
```
function calculatePay(checkIn: Date, checkOut: Date): PayEntry {
  const regularStart = setTime(checkIn.date, 08, 00)
  const regularEnd   = setTime(checkIn.date, 17, 00)

  // Regular hours: overlap of [checkIn, checkOut] with [08:00, 17:00]
  const regularOverlapStart = max(checkIn, regularStart)
  const regularOverlapEnd   = min(checkOut, regularEnd)
  const regularHours = max(0, regularOverlapEnd - regularOverlapStart) in hours

  // Morning overtime: time before 08:00
  const morningOT = max(0, min(checkOut, regularStart) - checkIn) in hours

  // Evening overtime: time after 17:00
  const eveningOT = max(0, checkOut - max(checkIn, regularEnd)) in hours

  // Regular day pay: only if employee worked AT LEAST some of 08:00-17:00
  const regularPay = regularHours > 0 ? 1000 : 0

  // Overtime rounded to nearest 30 min
  const totalOTHours = roundToHalfHour(morningOT + eveningOT)
  const overtimePay  = totalOTHours * 160

  return { regularHours, morningOT, eveningOT, regularPay, overtimePay,
           totalPay: regularPay + overtimePay }
}
```

---

## 9. Offline Sync Strategy

**Decision**: Hive (local NoSQL) as offline queue; sync on connectivity restore using
`connectivity_plus` to detect network state.

**Flow**:
1. Attendance event created → stored in Hive with status `pending`.
2. If online: immediately POST to backend; on success update status to `synced`.
3. If offline: Riverpod `ConnectivityNotifier` monitors network; on reconnect, flush all
   `pending` events in chronological order.
4. Server returns 409 Conflict if a duplicate (same employee, same date, same event type)
   is received → mobile marks event as `conflict` and notifies employee.

---

## 10. Cost Summary

| Service          | Provider         | Tier        | Monthly Cost |
|------------------|------------------|-------------|--------------|
| Database         | MongoDB Atlas    | M0 Free     | $0           |
| Backend API      | Render.com       | Free        | $0           |
| Web Dashboard    | Vercel           | Hobby Free  | $0           |
| Email (auth)     | Brevo            | Free        | $0           |
| **Total**        |                  |             | **$0/month** |

Upgrade path when production-ready: Render Starter ($7/month) to eliminate API cold starts.
