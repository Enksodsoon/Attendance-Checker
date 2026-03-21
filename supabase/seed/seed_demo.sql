insert into public.organizations (id, code, name_th, name_en)
values ('11111111-1111-1111-1111-111111111111', 'MAIN', 'มหาวิทยาลัยตัวอย่าง', 'Demo University')
on conflict (id) do nothing;

insert into public.campuses (id, organization_id, code, name_th, name_en)
values ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'BKK', 'วิทยาเขตกรุงเทพ', 'Bangkok Campus')
on conflict (id) do nothing;

insert into public.buildings (id, campus_id, code, name_th, name_en)
values ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'SCI', 'อาคารวิทยบริการ', 'Science Building')
on conflict (id) do nothing;

insert into public.rooms (id, building_id, code, name_th, latitude, longitude, default_radius_m, gps_policy)
values ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'B520', 'ห้อง B520', 13.736717, 100.523186, 100, 'allow_manual_approval')
on conflict (id) do nothing;

insert into public.profiles (id, organization_id, email, full_name_th, role, status, locale)
values
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'student@example.com', 'สมชาย ใจดี', 'student', 'active', 'th'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'teacher@example.com', 'ผศ.ดร.สุภาวดี แสงไทย', 'teacher', 'active', 'th'),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 'admin@example.com', 'ผู้ดูแลระบบ กลาง', 'admin', 'active', 'th')
on conflict (id) do nothing;

insert into public.line_accounts (id, profile_id, line_user_id, display_name, is_verified)
values ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'Udemo-line-001', 'Somchai', true)
on conflict (id) do nothing;

insert into public.students (id, profile_id, student_code, academic_year, faculty_name_th)
values ('77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', '6512345678', 2023, 'คณะวิทยาศาสตร์')
on conflict (id) do nothing;

insert into public.teachers (id, profile_id, teacher_code, department_name_th)
values ('88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555552', 'TCH001', 'ภาควิชาวิทยาการคอมพิวเตอร์')
on conflict (id) do nothing;

insert into public.admin_roles (id, profile_id, role)
values ('99999999-9999-9999-9999-999999999991', '55555555-5555-5555-5555-555555555553', 'admin')
on conflict (id) do nothing;

insert into public.courses (id, organization_id, course_code, name_th, name_en, credit_hours)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'CS101', 'การพัฒนาซอฟต์แวร์เชิงระบบ', 'Systems Software Development', 3)
on conflict (id) do nothing;

insert into public.course_sections (id, course_id, section_code, semester_label, academic_year, room_id, primary_teacher_id)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'A', '1/2026', 2026, '44444444-4444-4444-4444-444444444441', '88888888-8888-8888-8888-888888888881')
on conflict (id) do nothing;

insert into public.teacher_course_assignments (id, course_section_id, teacher_id, is_primary)
values ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '88888888-8888-8888-8888-888888888881', true)
on conflict (id) do nothing;

insert into public.student_enrollments (id, course_section_id, student_id, enrollment_status)
values ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '77777777-7777-7777-7777-777777777771', 'enrolled')
on conflict (id) do nothing;

insert into public.session_templates (id, course_section_id, weekday, scheduled_start_time, scheduled_end_time)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 6, '09:00', '12:00')
on conflict (id) do nothing;

insert into public.class_sessions (
  id, course_section_id, room_id, teacher_id, scheduled_start_at, scheduled_end_at, attendance_open_at, late_after_at, attendance_close_at, status, attendance_mode, verification_mode, allow_manual_approval
)
values (
  'ffffffff-ffff-ffff-ffff-fffffffffff1',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '44444444-4444-4444-4444-444444444441',
  '88888888-8888-8888-8888-888888888881',
  '2026-03-21T02:00:00Z',
  '2026-03-21T05:00:00Z',
  '2026-03-21T01:45:00Z',
  '2026-03-21T02:10:00Z',
  '2026-03-21T02:20:00Z',
  'open',
  'check_in_only',
  'gps_qr_timewindow',
  true
)
on conflict (id) do nothing;

insert into public.session_qr_codes (id, class_session_id, qr_token, expires_at, status, created_by)
values ('12121212-1212-1212-1212-121212121212', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'demo-token-20260321', '2026-03-21T02:20:00Z', 'active', '55555555-5555-5555-5555-555555555552')
on conflict (id) do nothing;

insert into public.attendance_attempts (id, class_session_id, student_id, submitted_at, latitude, longitude, gps_accuracy_m, distance_from_center_m, qr_token_submitted, verification_result, failure_reason, source)
values ('13131313-1313-1313-1313-131313131313', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '77777777-7777-7777-7777-777777777771', '2026-03-21T02:02:00Z', 13.73685, 100.52320, 12, 18, 'demo-token-20260321', 'accepted', 'ok_present', 'liff')
on conflict (id) do nothing;

insert into public.attendance_records (id, class_session_id, student_id, status, verified_by_method, accepted_attempt_id, checked_in_at, final_latitude, final_longitude, final_accuracy_m, final_distance_m, note)
values ('14141414-1414-1414-1414-141414141414', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '77777777-7777-7777-7777-777777777771', 'present', 'gps_qr_timewindow', '13131313-1313-1313-1313-131313131313', '2026-03-21T02:02:00Z', 13.73685, 100.52320, 12, 18, 'Auto accepted')
on conflict (id) do nothing;

insert into public.app_settings (key, value, description)
values
  ('attendance.defaults', '{"open_offset_min":15,"late_after_min":10,"close_offset_min":20,"default_radius_m":100,"max_accuracy_m":150}', 'Global attendance defaults'),
  ('line.liff', '{"enabled":true}', 'LIFF feature flag')
on conflict (key) do nothing;
