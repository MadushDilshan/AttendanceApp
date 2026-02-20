# Feature Specification: QR-Based Attendance & Payroll System

**Feature Branch**: `001-qr-attendance-payroll`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "I want to build Android App to employees and when they come to given specific location, Check-in button must be enabled. Then he must scan the QR Code using the android app. When they scan the given QR Code, that time should go to some where hosted database. Also In the evening the same QR code should be scanned at Checkout Time and Owner can able to monitor the check in and checkout time and the Time duration each person worked. For it, There should be a react app. Using this app, I would able to create pay sheet with how much time he has worked. Pay sheet criteria: 8:00 AM to 5:00 PM = Rs 1,000. Overtime (before 8:00 AM or after 5:00 PM) = Rs 160 per hour."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Employee Check-In at Work Location (Priority: P1)

An employee arrives at the designated work premises. The Android app detects that the employee is
within the allowed geofence radius of the workplace and enables the "Check In" button. The employee
taps "Check In", the app activates the device camera, and the employee scans the workplace QR code.
The exact timestamp of the scan is instantly recorded in the hosted database against the employee's
identity. The employee sees a confirmation screen showing their registered check-in time.

**Why this priority**: Without a successful check-in, no attendance record exists. This is the
foundational flow the entire system depends on.

**Independent Test**: Can be fully tested by having a registered employee open the app within
the geofenced area, tap Check In, scan the QR code, and verify that a check-in record appears
in the database with the correct employee ID and timestamp.

**Acceptance Scenarios**:

1. **Given** the employee is within the workplace geofence, **When** they open the app, **Then** the "Check In" button is enabled and tappable.
2. **Given** the "Check In" button is enabled, **When** the employee scans the correct workplace QR code, **Then** the system records the check-in timestamp and displays a success confirmation showing the recorded time.
3. **Given** the employee is outside the geofence radius, **When** they open the app, **Then** the "Check In" button is disabled with a message explaining they must be at the work location.
4. **Given** the employee has already checked in today and not yet checked out, **When** they attempt to check in again, **Then** the system prevents a duplicate check-in and shows an informational message.

---

### User Story 2 — Employee Check-Out at Work Location (Priority: P1)

At the end of the work shift, the employee opens the app. Since they have an open check-in for today,
the app shows a "Check Out" button. The employee scans the same workplace QR code. The checkout
timestamp is recorded in the database, closing the attendance record for the day. The employee sees
a daily summary showing total time worked, regular hours, and overtime hours.

**Why this priority**: Check-out completes the attendance record required for duration and pay
calculations. Without it, no wage can be computed for the day.

**Independent Test**: Can be fully tested after a successful check-in by tapping Check Out,
scanning the QR code, and verifying the database record contains both timestamps and a computed
duration.

**Acceptance Scenarios**:

1. **Given** the employee has an open check-in for today, **When** they open the app, **Then** the "Check Out" button is shown (replacing the "Check In" button) along with the recorded check-in time.
2. **Given** the employee taps "Check Out" and scans the workplace QR code, **Then** the checkout time is recorded, the record is closed, and a daily summary (total hours, regular vs. overtime) is displayed.
3. **Given** the employee tries to check out before they have checked in today, **Then** the system prevents checkout and prompts them to check in first.
4. **Given** an employee has not checked out by end of day (midnight), **Then** the record is automatically flagged "Incomplete" for the owner to review and manually close.

---

### User Story 3 — Owner Views Attendance Dashboard (Priority: P2)

The owner logs into the React web application and sees a dashboard listing all registered employees
with their attendance status for the current day (checked in, checked out, absent, incomplete). The
owner can select any employee and view their full attendance history filtered by date range. Each
record shows check-in time, checkout time, total hours worked, and a breakdown of regular versus
overtime hours.

**Why this priority**: Real-time monitoring is the owner's primary tool to manage the workforce.
It depends on P1 data being available but does not block paysheet generation.

**Independent Test**: Can be tested by logging in as an owner and confirming that records submitted
via the app appear with correct timestamps and duration breakdowns.

**Acceptance Scenarios**:

1. **Given** employees have attendance records for today, **When** the owner opens the dashboard, **Then** all employees are listed with their current status and today's check-in/checkout times.
2. **Given** the owner selects an employee and a date range, **When** they view history, **Then** each day shows: check-in time, checkout time, total hours, regular hours (08:00–17:00), and overtime hours (before 08:00 or after 17:00).
3. **Given** an attendance record is flagged "Incomplete", **When** the owner views it, **Then** they can enter a checkout time with a mandatory note, and the record is updated and marked as manually adjusted.
4. **Given** the owner has the owner/admin role, **When** they access the dashboard, **Then** they see all employees' records; an employee (if given web access) sees only their own records.

---

### User Story 4 — Owner Generates Pay Sheet (Priority: P3)

The owner selects one or more employees and a date range in the React app and triggers paysheet
generation. The system calculates wages using: Rs 1,000 flat for any day the employee worked regular
hours (08:00–17:00), plus Rs 160 per overtime hour (hours worked before 08:00 or after 17:00). The
owner can review the computed paysheet, then export it as a PDF or CSV file.

**Why this priority**: Paysheet depends on complete attendance data from P1 and P2. It is a
downstream value-add, not a system blocker.

**Independent Test**: Tested by selecting an employee with known attendance over a week and
verifying computed totals match manual calculation using the Rs 1,000 + Rs 160/hr rule.

**Acceptance Scenarios**:

1. **Given** an employee worked 07:30–18:00 on a day, **When** a paysheet is generated for that day, **Then** the system computes: Rs 1,000 (regular) + 0.5 hr morning OT (Rs 80) + 1 hr evening OT (Rs 160) = Rs 1,240.
2. **Given** an employee worked 09:00–16:00 on a day (entirely within regular hours), **When** a paysheet is generated, **Then** the system computes Rs 1,000 with Rs 0 overtime.
3. **Given** an employee has an "Incomplete" record for a day, **When** generating a paysheet that includes that day, **Then** that day is skipped in the calculation, flagged in the output, and the owner is notified to resolve it first.
4. **Given** a paysheet is calculated, **When** the owner exports it, **Then** a downloadable PDF and CSV are produced containing: employee name, dates, regular hours, overtime hours, regular pay, overtime pay, and total pay per day and as a period total.

---

### Edge Cases

- What happens when the employee's GPS is disabled or inaccurate? → App MUST display a clear error asking the employee to enable location services; Check In/Out buttons remain disabled.
- What happens if the QR code scan fails (poor lighting, damaged code)? → App MUST allow retries and show guidance ("Ensure QR code is fully visible and well-lit").
- What if network is unavailable during scan? → Event queued locally; auto-synced on reconnect; employee sees "Pending Sync" indicator.
- What if two employees scan the same QR code simultaneously? → Each event is independently recorded by authenticated employee identity; concurrent writes MUST not cause data loss.
- What if a day has no check-out record at paysheet generation time? → Incomplete days are excluded from pay calculation and flagged for the owner.

---

## Requirements *(mandatory)*

### Functional Requirements

**Mobile App (Flutter Android)**

- **FR-001**: The app MUST detect the employee's real-time GPS location and compare it against the registered workplace geofence.
- **FR-002**: The "Check In" button MUST be enabled only when the employee is within the configured geofence radius AND has no open check-in for the current day.
- **FR-003**: The "Check Out" button MUST be shown and enabled only when the employee has an open (unclosed) check-in record for the current day.
- **FR-004**: Upon tapping Check In or Check Out, the app MUST activate the device camera to scan a QR code.
- **FR-005**: Upon successful QR scan, the app MUST transmit the attendance event (employee ID, event type, device timestamp, GPS coordinates) to the hosted backend and display the server-confirmed timestamp to the employee.
- **FR-006**: If the network is unavailable, the app MUST queue the event locally and sync automatically when connectivity is restored, showing a "Pending Sync" indicator to the employee.
- **FR-007**: The app MUST require authenticated login (email + password) before any attendance action is available.
- **FR-008**: After a successful checkout, the app MUST display a daily summary to the employee showing total hours worked, regular hours (08:00–17:00), and overtime hours.

**Web Dashboard (React)**

- **FR-009**: The dashboard MUST require owner/admin authentication before any data is accessible.
- **FR-010**: The dashboard MUST display a real-time attendance overview showing all registered employees and their attendance status for the current day.
- **FR-011**: The owner MUST be able to filter attendance records by employee and date range.
- **FR-012**: Each displayed attendance record MUST include: employee name, check-in time, checkout time, total hours, regular hours (08:00–17:00), and overtime hours (before 08:00 or after 17:00).
- **FR-013**: The owner MUST be able to manually close an "Incomplete" record by entering a checkout time with a mandatory note; the adjustment MUST be logged in an audit trail.
- **FR-014**: The owner MUST be able to add, edit, and deactivate employee accounts (name, email, role, status).
- **FR-015**: The owner MUST be able to configure the workplace location (GPS coordinates) and geofence radius from a settings screen.
- **FR-016**: The owner MUST be able to generate a paysheet for a selected set of employees and a specified date range.
- **FR-017**: The paysheet calculation MUST apply: Rs 1,000 per day where the employee worked within 08:00–17:00 (regular day rate), plus Rs 160 per overtime hour for time before 08:00 or after 17:00.
- **FR-018**: Incomplete attendance records MUST be excluded from paysheet calculations and flagged in the output.
- **FR-019**: The paysheet MUST be exportable as both PDF and CSV.
- **FR-020**: The dashboard MUST display an audit log showing manual adjustments (who, what, when) on attendance records.

### Key Entities

- **Employee**: Registered worker. Attributes: ID, name, email, role (employee / owner-admin), status (active / inactive), assigned workplace.
- **Workplace**: Physical location. Attributes: ID, name, GPS coordinates (latitude/longitude), geofence radius (metres), QR code payload (unique identifier string).
- **AttendanceRecord**: One record per employee per day. Attributes: ID, employee ID, workplace ID, date, check-in timestamp, checkout timestamp, status (open / closed / incomplete), is-manually-adjusted, adjustment note, adjusted-by user ID.
- **PaysheetEntry**: Computed row for one employee for one day. Attributes: employee ID, date, regular hours, overtime hours morning, overtime hours evening, regular pay (Rs 1,000 if applicable), overtime pay (hours × Rs 160), total pay, record status.
- **PaySheet**: Grouped export. Attributes: ID, generated-by user ID, generated-at timestamp, period start, period end, employee IDs included, total payable amount, export status (draft / processed).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An employee can complete the full check-in flow (open app → button enabled → scan QR → see confirmation) in under 30 seconds under normal network conditions.
- **SC-002**: Attendance data submitted via the mobile app appears on the owner dashboard within 5 seconds of a successful sync.
- **SC-003**: Paysheet generation for a 30-day period covering up to 50 employees completes in under 10 seconds.
- **SC-004**: 100% of attendance events submitted while offline are successfully synced and recorded once connectivity is restored, with zero data loss.
- **SC-005**: The Check In button is never enabled when the employee is outside the configured geofence (zero false-positive geofence triggers).
- **SC-006**: Pay calculations contain zero arithmetic errors compared to manual calculation using the Rs 1,000 + Rs 160/hr rule for any combination of regular and overtime hours.
- **SC-007**: The owner can generate and export a paysheet as PDF/CSV without technical assistance, completing the task in under 2 minutes.

---

## Assumptions

- **A-001**: Overtime hours are rounded to the nearest 30-minute increment for pay calculation.
- **A-002**: Overnight shifts (check-in before midnight, checkout after midnight) are assigned to the date of check-in for pay calculation purposes.
- **A-003**: The regular day rate (Rs 1,000) applies to any day the employee's work window includes the full 08:00–17:00 period. If the employee works entirely outside regular hours (e.g., 06:00–07:30 only), only overtime pay applies.
- **A-004**: Geofence radius defaults to 100 m and is configurable by the owner per workplace from the dashboard.
- **A-005**: Authentication uses email + password for both the mobile app and the web dashboard. Password reset via email link is included.
- **A-006**: Pay period for paysheet generation is user-defined (owner selects any start and end date). There is no enforced fixed pay cycle.
