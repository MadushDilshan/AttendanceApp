<!--
SYNC IMPACT REPORT
==================
Version change: N/A (template) → 1.0.0 (initial ratification)
Modified principles: N/A — all sections newly authored from template placeholders.
Added sections:
  - Core Principles (I–VII)
  - Technology Stack
  - Development Workflow
  - Governance
Templates updated:
  ✅ .specify/memory/constitution.md (this file)
  ✅ .specify/templates/plan-template.md — Constitution Check gate aligns with principles below
  ✅ .specify/templates/spec-template.md — mandatory sections align with dual-platform context
  ✅ .specify/templates/tasks-template.md — task phases reflect mobile + web path conventions
Deferred TODOs:
  - RATIFICATION_DATE: set to 2026-02-13 (today, initial creation)
  - Backend API service: not yet specified by user — assumed REST over HTTPS; revisit in spec phase
-->

# AttendanceApp Constitution

## Core Principles

### I. Dual-Platform Coherence (NON-NEGOTIABLE)

The system consists of exactly two client surfaces:

- **Flutter Android App** — employee-facing, handles attendance capture (check-in/check-out,
  geolocation, photo proof where applicable).
- **React Web Dashboard** — owner/manager-facing, provides real-time and historical monitoring
  of employee attendance records.

Every feature MUST be scoped to one or both surfaces. A shared backend API (REST over HTTPS)
MUST serve as the single source of truth; neither client may bypass it by storing authoritative
state locally. Any addition of a third client surface requires a constitution amendment.

**Rationale**: Keeping the platform boundary explicit prevents scope creep and ensures the
owner dashboard always reflects what the mobile app records.

### II. Quality-First Code (NON-NEGOTIABLE)

All code written for this project MUST meet the following non-negotiable quality bars:

- **Flutter/Dart**: Follow the official [Effective Dart](https://dart.dev/guides/language/effective-dart)
  style guide. Use `flutter analyze` with zero warnings as a gate before any merge.
- **React/TypeScript**: All React code MUST be written in TypeScript (strict mode). ESLint with
  the `react-hooks` and `@typescript-eslint` rule sets MUST pass with zero errors.
- **Backend**: API contracts MUST be documented (OpenAPI 3.x or equivalent). Breaking changes
  to any API contract require a version bump and migration notice.
- No commented-out dead code, no `TODO` comments older than one sprint, no `console.log` /
  `print()` debug statements in production paths.

**Rationale**: The user explicitly requested quality code. These gates make "quality" testable
and objective rather than aspirational.

### III. Test-Driven Development (NON-NEGOTIABLE)

For every non-trivial feature unit:

1. Write the test first (unit or widget/component test).
2. Confirm the test FAILS (red).
3. Implement the minimum code to pass (green).
4. Refactor without breaking the test.

- **Flutter**: `flutter test` coverage MUST remain ≥ 70% for business-logic layers
  (`services/`, `repositories/`, `bloc/` or `provider/` state classes).
- **React**: Jest + React Testing Library coverage MUST remain ≥ 70% for service and
  context/hook layers.
- Integration tests MUST cover the critical attendance submission flow end-to-end.

**Rationale**: TDD surfaces design issues early and prevents regression as the mobile and
web surfaces evolve in parallel.

### IV. Security & Privacy by Default

- All API communication MUST use HTTPS/TLS 1.2+; plain HTTP is forbidden in any environment
  including development (use local certs or a proxy).
- Employee location data and biometric/photo data are sensitive PII. They MUST be transmitted
  only over encrypted channels and stored with access controls enforced at the API layer.
- Authentication tokens (JWT or equivalent) MUST have a defined expiry and MUST be stored
  in secure storage (`flutter_secure_storage` on mobile; `HttpOnly` cookies or a secure
  token store on web — never `localStorage` for auth tokens).
- The React dashboard MUST enforce role-based access: owner/admin roles see all records;
  employee roles (if given web access) see only their own records.

**Rationale**: Attendance data is legally sensitive in many jurisdictions. Security cannot be
retrofitted; it MUST be built in from the first commit.

### V. Offline-Aware Mobile Design

The Flutter app MUST be designed with connectivity interruption in mind:

- Attendance events (check-in/check-out) MUST be queued locally when offline and synced
  automatically when connectivity is restored.
- The UI MUST clearly communicate the sync status (synced / pending / failed) to the employee.
- Conflict resolution policy: server timestamp wins; local record is flagged for review if
  a conflict is detected.

**Rationale**: Employees may work in areas with poor connectivity. Losing attendance records
due to a network blip is unacceptable.

### VI. Simplicity & YAGNI

- Add only what is required by the current feature specification. Do not build for hypothetical
  future requirements.
- Prefer the simplest data model, the fewest dependencies, and the smallest API surface that
  satisfies the current user stories.
- Any complexity beyond the minimum MUST be justified in the plan's Complexity Tracking table
  with a concrete, current reason.
- Third-party packages MUST be vetted for maintenance status (last release < 12 months) before
  adoption.

**Rationale**: A leaner codebase is easier to test, debug, and hand off. Over-engineering
attendance logic is a common failure mode for this category of app.

### VII. Observability & Auditability

- The backend MUST emit structured logs (JSON) for every attendance event, including
  `employee_id`, `event_type`, `timestamp`, `source_platform`, and `request_ip`.
- The React dashboard MUST surface an audit trail view accessible to owners that shows the
  raw event log for any employee over a selected date range.
- Flutter app MUST log errors via a crash/error reporting service (e.g., Firebase Crashlytics
  or Sentry) in production builds.

**Rationale**: Attendance is a legal and payroll-adjacent record. Owners need an immutable
audit trail. Engineers need observability to debug cross-platform issues.

## Technology Stack

The following technology choices are constitutionally fixed. Deviations require an amendment.

| Layer | Technology | Version Constraint |
|---|---|---|
| Mobile App | Flutter (Android) | Flutter 3.x stable channel |
| Mobile Language | Dart | Dart 3.x |
| Web Dashboard | React | React 18+ |
| Web Language | TypeScript | TypeScript 5+ (strict mode) |
| Web Build | Vite or Create-React-App (CRA) | Latest stable |
| State Management (Flutter) | BLoC or Riverpod | Team selects one per feature; document in plan.md |
| State Management (React) | React Context + hooks or Zustand | Document choice in plan.md |
| API Protocol | REST over HTTPS | OpenAPI 3.x contract mandatory |
| Backend Language | TODO(BACKEND_LANGUAGE): Not specified — recommend Node.js/TypeScript or Python/FastAPI |
| Database | TODO(DATABASE): Not specified — recommend PostgreSQL |

**Note**: Backend language and database are deferred pending further specification. All
backend choices MUST be documented in the first backend feature's `plan.md` and referenced
here via amendment before implementation begins.

## Development Workflow

### Branching

- `main` — production-ready code only. Direct pushes forbidden.
- `develop` — integration branch. All feature branches merge here first.
- `feature/###-short-name` — one branch per feature spec. Branch from `develop`.
- Hotfixes branch from `main` and merge back to both `main` and `develop`.

### Code Review

- Every PR MUST have at least one peer review before merge to `develop`.
- The reviewer MUST verify: Constitution Check compliance, test coverage gate, lint/analyze
  pass, no new TODOs without a linked issue.

### Quality Gates (CI)

Before any merge to `develop` or `main`, the following MUST pass automatically:

1. `flutter analyze` — zero warnings/errors.
2. `flutter test` — all tests pass, coverage ≥ 70% for business logic.
3. ESLint + TypeScript compiler — zero errors in React codebase.
4. Jest tests — all pass, coverage ≥ 70% for service/hook layers.
5. API contract linting (if backend changes) — OpenAPI spec validates cleanly.

### Commit Messages

Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).
Scope SHOULD indicate platform: `feat(flutter):`, `feat(react):`, `fix(api):`.

## Governance

This constitution supersedes all other project conventions. In case of conflict between this
document and any other guideline, practice, or tool output, this constitution takes precedence.

**Amendment Procedure**:

1. Raise a proposal in a PR that modifies this file.
2. State the version bump type (MAJOR / MINOR / PATCH) with justification.
3. Update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION`.
4. Obtain approval from the project owner before merging.
5. Update all affected templates and linked artifacts as listed in the Sync Impact Report.

**Versioning Policy**:

- MAJOR: Removal or redefinition of a Core Principle; removal of a constitutionally fixed technology.
- MINOR: New principle, new mandatory section, or expansion of an existing principle with new rules.
- PATCH: Wording clarifications, typo fixes, non-semantic refinements, date updates.

**Compliance Review**: Every feature plan (`plan.md`) MUST include a "Constitution Check"
section that verifies compliance with all seven Core Principles before Phase 0 research begins.
The check MUST be re-verified after Phase 1 design is complete.

**Version**: 1.0.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-13
