# Attendance Checker MVP

Production-minded MVP for a university attendance system that runs inside LINE via LIFF for students, with Next.js dashboards for teachers and admins. The implementation keeps one reliable attendance engine in scope for MVP: **GPS + QR + time window**.

## Folder structure

```text
.
├── app/
│   ├── (student)/liff/                # LIFF bootstrap, bind, check-in, history
│   ├── (teacher)/teacher/sessions/    # Teacher session list + live monitor
│   ├── (admin)/admin/                 # Admin home shell
│   └── api/                           # Check-in, monitor, export, QR refresh, audit endpoints
├── components/
│   ├── student/                       # Student LIFF UI pieces
│   ├── teacher/                       # Teacher dashboard widgets
│   └── ui/                            # Shared UI primitives
├── lib/
│   ├── auth/                          # Authorization guards
│   ├── config/                        # Typed environment loader
│   ├── liff/                          # LIFF initialization helper
│   ├── services/                      # Attendance validation, audit logging, demo adapters
│   ├── supabase/                      # Supabase client factories
│   ├── utils/                         # Distance, QR, CSV helpers
│   └── validators/                    # Zod request schemas
├── supabase/
│   ├── migrations/                    # Supabase SQL migrations
│   └── seed/                          # Demo seed SQL
└── scripts/                           # Local helper scripts
```

## What is implemented first

- Next.js App Router foundation with Thai-first pages for student, teacher, and admin flows.
- Supabase SQL migration covering all requested core tables, indexes, timestamps, enums, and starter RLS policies.
- Core TypeScript domain types for roles, sessions, attendance, teacher monitoring, and audit inputs.
- Server-side attendance validation module with the required validation order, GPS distance checks, QR validation, duplicate protection, and manual approval fallback.
- Student LIFF bootstrap UI, bind page shell, check-in page, history page, and teacher live monitor page.
- CSV export route and audit log utility scaffold.

## Setup

1. Install dependencies.
   ```bash
   npm install
   ```
2. Copy environment values.
   ```bash
   cp .env.example .env.local
   ```
3. Fill in Supabase and LINE credentials in `.env.local`.
4. Run the SQL migration in Supabase SQL editor or with the Supabase CLI.
5. Run the demo seed SQL in `supabase/seed/seed_demo.sql`.
6. Start the app.
   ```bash
   npm run dev
   ```

## Supabase configuration notes

- Use Supabase Auth for teacher/admin sign-in, and store the linked auth user in `profiles.auth_user_id`.
- For students, bind LINE identities in `line_accounts`, then resolve the internal student record server-side before any attendance action.
- Keep all final attendance decisions on the server. The client only sends QR token, location sample, and optional manual reason.
- Existing RLS policies are intentionally conservative starter policies. Expand them together with role-aware RPCs or service-layer guards before production rollout.

## LINE LIFF configuration notes

- Create one LIFF app for the student experience and set the LIFF URL to `/liff`.
- Put the LIFF ID in `NEXT_PUBLIC_LIFF_ID`.
- The LIFF client bootstrap lives in `lib/liff/client.ts` and is used by `components/student/liff-bootstrap.tsx`.
- In production, verify LINE identity with an access token or ID token exchange on the server before trusting `line_user_id`.

## Attendance workflow summary

1. Student opens LIFF and initializes LINE profile.
2. Server resolves `line_accounts -> profiles -> students`.
3. Student chooses an open session.
4. Client requests browser geolocation and scans/submits QR token.
5. Server validates session state, enrollment, time window, duplicate attendance, QR token, GPS accuracy, and distance.
6. Server writes `attendance_attempts`, finalizes `attendance_records`, and optionally creates `manual_approval_requests`.
7. Teacher monitor shows present/late/pending/absent counts and exports CSV.

## Future extension points

- **Check-out:** add a second attendance phase and extend `attendance_mode` with session lifecycle hooks.
- **Repeated presence checks:** add background job + additional verification attempt tables without changing the MVP check-in contract.
- **Rotating QR intervals:** create short-lived rows in `session_qr_codes` and refresh from the teacher QR endpoint.
- **Timetable import:** attach import pipelines to `session_templates` and `class_sessions` generation.
- **Hybrid attendance modes:** add new enum values and separate validation services while keeping the current `gps_qr_timewindow` flow isolated.
- **Stronger anti-cheat:** insert trusted device attestations, signed LIFF tokens, and anomaly detection into the service layer rather than the UI.
