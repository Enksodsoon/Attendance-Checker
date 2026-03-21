create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher', 'admin', 'super_admin');
create type public.profile_status as enum ('active', 'inactive', 'suspended');
create type public.session_status as enum ('draft', 'open', 'closed', 'cancelled');
create type public.attendance_status as enum ('present', 'late', 'absent', 'pending_approval', 'excused', 'rejected');
create type public.verification_mode as enum ('gps_qr_timewindow');
create type public.attendance_mode as enum ('check_in_only');
create type public.gps_policy as enum ('strict', 'allow_manual_approval');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.record_source as enum ('liff', 'teacher_override', 'admin_override');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_th text not null,
  name_en text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name_th text not null,
  name_en text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id) on delete cascade,
  code text not null,
  name_th text not null,
  name_en text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campus_id, code)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  code text not null,
  name_th text not null,
  latitude double precision not null,
  longitude double precision not null,
  default_radius_m integer not null default 100,
  gps_policy public.gps_policy not null default 'allow_manual_approval',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (building_id, code)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text unique,
  full_name_th text not null,
  full_name_en text,
  role public.app_role not null,
  status public.profile_status not null default 'active',
  locale text not null default 'th',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.line_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  line_user_id text not null unique,
  display_name text,
  picture_url text,
  is_verified boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  student_code text not null unique,
  academic_year integer,
  faculty_name_th text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  teacher_code text not null unique,
  department_name_th text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, role)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_code text not null,
  name_th text not null,
  name_en text,
  credit_hours integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, course_code)
);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_code text not null,
  semester_label text not null,
  academic_year integer not null,
  room_id uuid references public.rooms(id) on delete set null,
  primary_teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (course_id, section_code, semester_label, academic_year)
);

create table public.teacher_course_assignments (
  id uuid primary key default gen_random_uuid(),
  course_section_id uuid not null references public.course_sections(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (course_section_id, teacher_id)
);

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_section_id uuid not null references public.course_sections(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_status text not null default 'enrolled',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (course_section_id, student_id)
);

create table public.session_templates (
  id uuid primary key default gen_random_uuid(),
  course_section_id uuid not null references public.course_sections(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  scheduled_start_time time not null,
  scheduled_end_time time not null,
  attendance_open_offset_min integer not null default 15,
  late_after_offset_min integer not null default 10,
  attendance_close_offset_min integer not null default 20,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  course_section_id uuid not null references public.course_sections(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  attendance_open_at timestamptz not null,
  late_after_at timestamptz not null,
  attendance_close_at timestamptz not null,
  status public.session_status not null default 'draft',
  attendance_mode public.attendance_mode not null default 'check_in_only',
  verification_mode public.verification_mode not null default 'gps_qr_timewindow',
  allow_manual_approval boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.session_qr_codes (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references public.class_sessions(id) on delete cascade,
  qr_token text not null unique,
  expires_at timestamptz not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.attendance_attempts (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  submitted_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  gps_accuracy_m double precision,
  distance_from_center_m double precision,
  qr_token_submitted text,
  verification_result text not null,
  failure_reason text,
  device_user_agent text,
  source public.record_source not null default 'liff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null,
  verified_by_method text not null,
  accepted_attempt_id uuid references public.attendance_attempts(id) on delete set null,
  checked_in_at timestamptz,
  final_latitude double precision,
  final_longitude double precision,
  final_accuracy_m double precision,
  final_distance_m double precision,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (class_session_id, student_id)
);

create table public.manual_approval_requests (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_attempt_id uuid not null references public.attendance_attempts(id) on delete cascade,
  reason_text text not null,
  status public.approval_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.attendance_override_logs (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  old_status public.attendance_status not null,
  new_status public.attendance_status not null,
  reason_text text not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.system_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_profiles_role on public.profiles(role);
create index idx_line_accounts_line_user_id on public.line_accounts(line_user_id);
create index idx_students_student_code on public.students(student_code);
create index idx_teachers_teacher_code on public.teachers(teacher_code);
create index idx_course_sections_room_id on public.course_sections(room_id);
create index idx_teacher_assignments_teacher_id on public.teacher_course_assignments(teacher_id);
create index idx_student_enrollments_student_id on public.student_enrollments(student_id);
create index idx_class_sessions_course_section_id on public.class_sessions(course_section_id);
create index idx_class_sessions_teacher_id on public.class_sessions(teacher_id);
create index idx_class_sessions_status on public.class_sessions(status);
create index idx_session_qr_codes_session_id on public.session_qr_codes(class_session_id);
create index idx_attendance_attempts_session_student on public.attendance_attempts(class_session_id, student_id);
create index idx_attendance_records_session_status on public.attendance_records(class_session_id, status);
create index idx_manual_approval_requests_status on public.manual_approval_requests(status);
create index idx_system_audit_logs_actor on public.system_audit_logs(actor_profile_id);
create index idx_system_audit_logs_entity on public.system_audit_logs(entity_type, entity_id);

create trigger set_updated_at_organizations before update on public.organizations for each row execute function public.set_updated_at();
create trigger set_updated_at_campuses before update on public.campuses for each row execute function public.set_updated_at();
create trigger set_updated_at_buildings before update on public.buildings for each row execute function public.set_updated_at();
create trigger set_updated_at_rooms before update on public.rooms for each row execute function public.set_updated_at();
create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_line_accounts before update on public.line_accounts for each row execute function public.set_updated_at();
create trigger set_updated_at_students before update on public.students for each row execute function public.set_updated_at();
create trigger set_updated_at_teachers before update on public.teachers for each row execute function public.set_updated_at();
create trigger set_updated_at_admin_roles before update on public.admin_roles for each row execute function public.set_updated_at();
create trigger set_updated_at_courses before update on public.courses for each row execute function public.set_updated_at();
create trigger set_updated_at_course_sections before update on public.course_sections for each row execute function public.set_updated_at();
create trigger set_updated_at_teacher_course_assignments before update on public.teacher_course_assignments for each row execute function public.set_updated_at();
create trigger set_updated_at_student_enrollments before update on public.student_enrollments for each row execute function public.set_updated_at();
create trigger set_updated_at_session_templates before update on public.session_templates for each row execute function public.set_updated_at();
create trigger set_updated_at_class_sessions before update on public.class_sessions for each row execute function public.set_updated_at();
create trigger set_updated_at_session_qr_codes before update on public.session_qr_codes for each row execute function public.set_updated_at();
create trigger set_updated_at_attendance_attempts before update on public.attendance_attempts for each row execute function public.set_updated_at();
create trigger set_updated_at_attendance_records before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger set_updated_at_manual_approval_requests before update on public.manual_approval_requests for each row execute function public.set_updated_at();
create trigger set_updated_at_attendance_override_logs before update on public.attendance_override_logs for each row execute function public.set_updated_at();
create trigger set_updated_at_app_settings before update on public.app_settings for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.line_accounts enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_attempts enable row level security;
alter table public.manual_approval_requests enable row level security;
alter table public.system_audit_logs enable row level security;

create policy "students can view own profile" on public.profiles
for select
using (auth.uid() = auth_user_id);

create policy "students can view own line account" on public.line_accounts
for select
using (exists (
  select 1 from public.profiles p
  where p.id = line_accounts.profile_id and p.auth_user_id = auth.uid()
));

create policy "students can view own student row" on public.students
for select
using (exists (
  select 1 from public.profiles p
  where p.id = students.profile_id and p.auth_user_id = auth.uid()
));

create policy "teachers and admins manage sessions" on public.class_sessions
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid() and p.role in ('teacher', 'admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid() and p.role in ('teacher', 'admin', 'super_admin')
  )
);

create policy "students view own attendance records" on public.attendance_records
for select
using (
  exists (
    select 1
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where s.id = attendance_records.student_id and p.auth_user_id = auth.uid()
  )
);

create policy "students insert attendance attempts" on public.attendance_attempts
for insert
with check (
  exists (
    select 1
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where s.id = attendance_attempts.student_id and p.auth_user_id = auth.uid()
  )
);

create policy "students view own manual approvals" on public.manual_approval_requests
for select
using (
  exists (
    select 1
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where s.id = manual_approval_requests.student_id and p.auth_user_id = auth.uid()
  )
);

create policy "admins view audit logs" on public.system_audit_logs
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid() and p.role in ('admin', 'super_admin')
  )
);
