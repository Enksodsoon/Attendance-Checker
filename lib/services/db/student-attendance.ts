import type {
  AttendanceDecision,
  AttendanceHistoryItem,
  AttendanceStatus,
  SessionSummary,
  StudentDashboardData,
  StudentIdentity
} from '@/lib/types';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type Row = Record<string, unknown>;

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

/**
 * Expected relational path:
 * LINE -> line_accounts -> profiles -> students -> student_enrollments -> course_sections -> class_sessions
 */
function mapSession(rawRow: Row): SessionSummary {
  const room = pickFirst(rawRow.rooms as Row | Row[] | null);
  const teacher = pickFirst(rawRow.teachers as Row | Row[] | null);
  const teacherProfile = pickFirst((teacher?.profiles as Row | Row[] | null) ?? null);
  const section = pickFirst(rawRow.course_sections as Row | Row[] | null);
  const course = pickFirst((section?.courses as Row | Row[] | null) ?? null);

  return {
    sessionId: String(rawRow.id ?? ''),
    courseCode: String(course?.course_code ?? '-'),
    courseNameTh: String(course?.name_th ?? '-'),
    sectionCode: String(section?.section_code ?? '-'),
    teacherName: String(teacherProfile?.full_name_th ?? '-'),
    room: {
      roomId: String(room?.id ?? ''),
      roomName: String(room?.name_th ?? '-'),
      latitude: Number(room?.latitude ?? 0),
      longitude: Number(room?.longitude ?? 0),
      defaultRadiusM: Number(room?.default_radius_m ?? 100),
      gpsPolicy: String(room?.gps_policy ?? 'allow_manual_approval') as SessionSummary['room']['gpsPolicy']
    },
    status: String(rawRow.status ?? 'draft') as SessionSummary['status'],
    verificationMode: String(rawRow.verification_mode ?? 'gps_qr_timewindow') as SessionSummary['verificationMode'],
    attendanceMode: String(rawRow.attendance_mode ?? 'check_in_only') as SessionSummary['attendanceMode'],
    allowManualApproval: Boolean(rawRow.allow_manual_approval ?? true),
    window: {
      scheduledStartAt: String(rawRow.scheduled_start_at ?? ''),
      scheduledEndAt: String(rawRow.scheduled_end_at ?? ''),
      attendanceOpenAt: String(rawRow.attendance_open_at ?? ''),
      lateAfterAt: String(rawRow.late_after_at ?? ''),
      attendanceCloseAt: String(rawRow.attendance_close_at ?? '')
    }
  };
}

export async function getStudentIdentityByProfile(profileId: string): Promise<StudentIdentity | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name_th, students(id, student_code), line_accounts(line_user_id)')
    .eq('id', profileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const studentRow = pickFirst((data.students as Row | Row[] | null) ?? null);
  if (!studentRow?.id || !studentRow.student_code) {
    return null;
  }

  const lineAccount = pickFirst((data.line_accounts as Row | Row[] | null) ?? null);

  return {
    profileId: String(data.id),
    studentId: String(studentRow.id),
    studentCode: String(studentRow.student_code),
    fullNameTh: String(data.full_name_th ?? '-'),
    lineUserId: String(lineAccount?.line_user_id ?? ''),
    role: 'student'
  };
}

export async function getStudentSessions(profileId: string) {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return [];

  const admin = createSupabaseAdminClient();
  const { data: enrollments } = await admin
    .from('student_enrollments')
    .select('course_section_id')
    .eq('student_id', identity.studentId)
    .eq('enrollment_status', 'enrolled');

  const sectionIds = (enrollments ?? [])
    .map((item) => item.course_section_id)
    .filter((value): value is string => Boolean(value));

  if (sectionIds.length === 0) {
    return [];
  }

  const { data: sessions } = await admin
    .from('class_sessions')
    .select(`
      id,status,verification_mode,attendance_mode,allow_manual_approval,
      scheduled_start_at,scheduled_end_at,attendance_open_at,late_after_at,attendance_close_at,
      rooms(id,name_th,latitude,longitude,default_radius_m,gps_policy),
      teachers(id,profiles(full_name_th)),
      course_sections(id,section_code,courses(course_code,name_th))
    `)
    .in('course_section_id', sectionIds)
    .order('scheduled_start_at', { ascending: true });

  return (sessions ?? []).map((row) => mapSession(row as Row));
}

export async function getCurrentQrToken(sessionId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from('session_qr_codes')
    .select('qr_token, expires_at')
    .eq('class_session_id', sessionId)
    .eq('status', 'active')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.qr_token ?? null;
}

export async function getSessionById(sessionId: string): Promise<SessionSummary | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('class_sessions')
    .select(`
      id,status,verification_mode,attendance_mode,allow_manual_approval,
      scheduled_start_at,scheduled_end_at,attendance_open_at,late_after_at,attendance_close_at,
      rooms(id,name_th,latitude,longitude,default_radius_m,gps_policy),
      teachers(id,profiles(full_name_th)),
      course_sections(id,section_code,courses(course_code,name_th))
    `)
    .eq('id', sessionId)
    .maybeSingle();

  return data ? mapSession(data as Row) : null;
}

export async function isStudentEnrolled(profileId: string, sessionId: string): Promise<boolean> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return false;

  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from('class_sessions')
    .select('course_section_id')
    .eq('id', sessionId)
    .maybeSingle();

  const sectionId = session?.course_section_id;
  if (!sectionId) {
    return false;
  }

  const { data } = await admin
    .from('student_enrollments')
    .select('id')
    .eq('student_id', identity.studentId)
    .eq('course_section_id', sectionId)
    .eq('enrollment_status', 'enrolled')
    .limit(1);

  return Boolean(data && data.length > 0);
}

export async function getExistingRecordStatus(profileId: string, sessionId: string): Promise<AttendanceStatus | undefined> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return undefined;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('attendance_records')
    .select('status')
    .eq('class_session_id', sessionId)
    .eq('student_id', identity.studentId)
    .maybeSingle();

  return data?.status as AttendanceStatus | undefined;
}

export async function recordAttendanceDecision(params: {
  profileId: string;
  sessionId: string;
  attemptId: string;
  submittedAt: string;
  decision: AttendanceDecision;
  payload: { latitude?: number; longitude?: number; gpsAccuracyM?: number; qrToken?: string; deviceUserAgent?: string };
}) {
  const identity = await getStudentIdentityByProfile(params.profileId);
  if (!identity) throw new Error('Student identity not found');

  const admin = createSupabaseAdminClient();

  const { error: attemptError } = await admin.from('attendance_attempts').insert({
    id: params.attemptId,
    class_session_id: params.sessionId,
    student_id: identity.studentId,
    submitted_at: params.submittedAt,
    latitude: params.payload.latitude,
    longitude: params.payload.longitude,
    gps_accuracy_m: params.payload.gpsAccuracyM,
    distance_from_center_m: params.decision.distanceFromCenterM,
    qr_token_submitted: params.payload.qrToken ?? '',
    verification_result: params.decision.verificationResult,
    failure_reason: params.decision.reasonCode,
    device_user_agent: params.payload.deviceUserAgent,
    source: 'liff'
  });

  if (attemptError) throw attemptError;

  if (params.decision.verificationResult === 'accepted' || params.decision.verificationResult === 'pending_approval') {
    const { error: upsertError } = await admin
      .from('attendance_records')
      .upsert(
        {
          class_session_id: params.sessionId,
          student_id: identity.studentId,
          status: params.decision.status,
          verified_by_method: 'gps_qr_timewindow',
          accepted_attempt_id: params.attemptId,
          checked_in_at: params.submittedAt,
          final_latitude: params.payload.latitude,
          final_longitude: params.payload.longitude,
          final_accuracy_m: params.payload.gpsAccuracyM,
          final_distance_m: params.decision.distanceFromCenterM,
          note: params.decision.reasonCode
        },
        { onConflict: 'class_session_id,student_id' }
      );

    if (upsertError) throw upsertError;
  }
}

export async function getStudentDashboard(profileId: string): Promise<StudentDashboardData> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) {
    return {
      student: {
        profileId,
        studentId: '',
        studentCode: '',
        fullNameTh: '-',
        lineUserId: '',
        role: 'student'
      },
      activeSessions: [],
      summary: { totalPresent: 0, totalLate: 0, totalPending: 0, totalAbsent: 0 },
      recentHistory: []
    };
  }

  const [activeSessions, history] = await Promise.all([getStudentSessions(profileId), getStudentHistory(profileId)]);

  const summary = history.reduce(
    (acc, item) => {
      if (item.status === 'present') acc.totalPresent += 1;
      if (item.status === 'late') acc.totalLate += 1;
      if (item.status === 'pending_approval') acc.totalPending += 1;
      if (item.status === 'absent' || item.status === 'rejected') acc.totalAbsent += 1;
      return acc;
    },
    { totalPresent: 0, totalLate: 0, totalPending: 0, totalAbsent: 0 }
  );

  return {
    student: identity,
    activeSessions: activeSessions.filter((session) => session.status === 'open'),
    summary,
    recentHistory: history
  };
}

export async function getStudentHistory(profileId: string): Promise<AttendanceHistoryItem[]> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return [];

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('attendance_records')
    .select(`
      id,status,checked_in_at,note,
      class_sessions!inner(
        id,
        course_sections(section_code,courses(course_code,name_th))
      )
    `)
    .eq('student_id', identity.studentId)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => {
    const typedRow = row as Row;
    const checkedInAt = typedRow.checked_in_at ? String(typedRow.checked_in_at) : undefined;
    const session = pickFirst(typedRow.class_sessions as Row | Row[] | null);
    const section = pickFirst((session?.course_sections as Row | Row[] | null) ?? null);
    const course = pickFirst((section?.courses as Row | Row[] | null) ?? null);

    return {
      recordId: String(typedRow.id),
      sessionId: String(session?.id ?? ''),
      dateLabel: checkedInAt ? new Date(checkedInAt).toLocaleDateString('th-TH') : '-',
      courseLabel: `${String(course?.course_code ?? '-')} · ${String(course?.name_th ?? '-')}`,
      status: String(typedRow.status) as AttendanceStatus,
      checkedInAt,
      note: typedRow.note ? String(typedRow.note) : undefined
    } satisfies AttendanceHistoryItem;
  });
}

export async function resolveLineAccount(lineUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('line_accounts')
    .select('profile_id, line_user_id, profiles(role, status)')
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  const profileRow = pickFirst((data?.profiles as Row | Row[] | null) ?? null);
  if (!data || !profileRow || String(profileRow.status) !== 'active') return null;

  return {
    profileId: String(data.profile_id),
    lineUserId: String(data.line_user_id),
    role: mapRole(String(profileRow.role))
  };
}

function mapRole(role: string) {
  return role === 'teacher' || role === 'admin' || role === 'super_admin' ? role : 'student';
}
