# AttendLink — Implementation Planning

Source: `CSC 336 Presentation.pptx` (9 slides). Subscription/billing/revenue-tier content
(slide 5, and the `subscriptions`/`payments` tables) is intentionally **out of scope** for
this plan per request — noted only where it already exists in the schema.

## 1. Concept recap (slides 1-2, 4, 6)

AttendLink is a digital attendance system: a professor opens a class session and projects
a QR code that rotates every ~15 seconds (TOTP-style). Students scan it on their phone and
are marked present within seconds. Goals: save time, reduce attendance fraud (proxy
check-ins), and give professors a live, exportable record.

Two user journeys drive the whole feature set:

- **Professor**: Log in → Open session → Display rotating QR → Track check-ins live → Export
  the record.
- **Student**: Log in → Scan QR → Device check (IP/location) → Validate → Present ✓.

## 2. Current implementation status

Already built and working:

- Auth (`src/lib/auth.remote.ts`, `src/routes/auth`), faculty/student dashboards.
- Class + session creation (`dashboard/faculty/class/[classId]/data.remote.ts`).
- Rotating QR token generation, 15s HMAC window (`session/[sessionId]/data.remote.ts:getLiveRotatingQrToken`).
- Student QR scan + check-in (`student/check-in/[sessionId]/[token]/data.remote.ts:verifyQrCheckIn`),
  including IP address + user-agent capture on the attendance record.
- Live attendance tracking for faculty: `getLiveAttendanceCount`, `getSessionAttendance`
  (both use `query.live`).
- AI assistant (`dashboard/faculty/assistant`) using `@ai-sdk/svelte` `Chat` +
  `src/lib/server/ai/tools.ts`, backed by Google Vertex AI (`provider.ts`) — matches the
  "Client Layer / Application Layer / External Infrastructure" stack diagram on slide 7
  exactly (SvelteKit Remote Functions + Vercel AI SDK Core & Tool Definitions + Vertex AI).
- Schema: `users`, `classes`, `enrollments`, `class_sessions`, `attendance_records`,
  `class_network_restrictions`, `user_sessions`, plus indexes and the
  `class_attendance_summary` analytics view.

Gaps between the presentation and the current code (this plan covers these):

- IP/ASN filtering and geofencing (slide 4 & 6: "Professor can optionally setup IP
  filtering and geofencing" / "Device check: IP, location, etc") — `class_network_restrictions`
  table exists but nothing reads or enforces it yet.
- "First scan binds device" (slide 4 user journey map) — no device-binding/fingerprint
  check exists; a student's second scan just overwrites `ip_address`/`user_agent` with no
  comparison against the first.
- Attendance export after class (slide 4 & 6: "Reviews flags, exports the record") — no
  CSV/Excel export exists anywhere in the faculty dashboard.
- Two stored procedures (required by the course brief, not from the deck, but tracked here
  since it's a hard project requirement) — none exist in `migrations/`.
- UML deliverables (flow, sequence, user journey diagrams) — documentation only, not code.

## 3. Work items

### 3.1 IP/ASN filtering & geofencing enforcement

- Add a lookup step in `verifyQrCheckIn` (`student/check-in/[sessionId]/[token]/data.remote.ts`):
  resolve the request IP's ASN (e.g. via a local MaxMind GeoLite2-ASN DB or an ASN lookup
  service) and compare against `class_network_restrictions.allowed_asn` for the session's
  `class_id`. Reject with `error(403, ...)` if the class has restrictions configured and the
  student's ASN isn't in the allow-list.
- Store the resolved ASN on `attendance_records.asn` (column already exists, currently unused).
- Add a faculty-facing UI (class settings, likely a new section on the class page) to
  add/remove allowed ASNs — a thin remote-function CRUD over `class_network_restrictions`.
- Treat this as fully optional per class: if a class has zero rows in
  `class_network_restrictions`, skip the check entirely (matches "can optionally setup").

### 3.3 Attendance export

- Add a remote `command`/`query` in `session/[sessionId]/data.remote.ts` that generates a
  CSV from `getSessionAttendance`'s query (student name, email, status, verified_at, ip,
  asn).
- Add an "Export" button on the session page
  (`dashboard/faculty/class/[classId]/session/[sessionId]/+page.svelte`) that downloads the
  CSV client-side (build the CSV string server-side, return it, trigger a `Blob` download —
  no need for a `+server.ts` route since this is a one-shot file response handled fine via a
  remote function returning text).
- Excel (`.xlsx`) is a stretch goal from `PROJECT_THEME.md`; CSV alone satisfies "one-click
  export."

### 3.4 Stored procedures (2 required)

Good candidates that fit existing features and avoid touching subscriptions:

1. `record_attendance(session_id, student_id, status, ip, user_agent, asn, device_id)` —
   wraps the upsert currently done inline in `verifyQrCheckIn` and `updateAttendanceStatus`
   into a single `PROCEDURE`, so both the student check-in path and the faculty manual
   override path call the same DB-side logic.
2. `close_expired_sessions()` — a maintenance procedure that sets `attendance_expires_at`
   to `NOW()` for any session past its window without an explicit stop (or similar cleanup
   task); could be invoked via a scheduled job or a manual admin action.

Add both to the existing migration file (`migrations/20260621221914-initial-tables.sql`)
per project convention, then `pnpm migrate:reset` locally.

### 3.5 Documentation deliverables (non-code)

- Flow diagram, sequence diagram, and user journey map (slide 4/6 already sketch the user
  journey maps — reuse those directly) — assemble as the "three additional UML diagrams"
  required by the course brief. The Data Model Diagram should come from the schema in
  `migrations/20260621221914-initial-tables.sql`.

## 4. Explicitly out of scope

- Revenue tiers / pricing UI (slide 5): Free / Basic ($29.99/mo) / Premium — **skipped**.
- Any billing, `subscriptions`, or `payments` table wiring beyond what already exists in the
  schema (no new work planned against them).
