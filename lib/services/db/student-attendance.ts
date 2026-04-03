import type {
  AttendanceDecision,
  AttendanceHistoryItem,
  AttendanceStatus,
  SessionSummary,
  StudentDashboardData,
  StudentIdentity
} from '@/lib/types';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function mapSession(row: any): SessionSummary {
  return {
    sessionId: row.id,
    courseCode: row.course_sections?.courses?.course_code ?? '-',
    courseNameTh: row.course_sections?.courses?.name_th ?? '-',
    sectionCode: row.course_sections?.section_code ?? '-',
    teacherName: row.teachers?.profiles?.full_name_th ?? '-',
    room: {
      roomId: row.rooms?.id ?? '',
      roomName: row.rooms?.name_th ?? '-',
      latitude: row.rooms?.latitude ?? 0,
      longitude: row.rooms?.longitude ?? 0,
      defaultRadiusM: row.rooms?.default_radius_m ?? 100,
      gpsPolicy: row.rooms?.gps_policy ?? 'allow_manual_approval'
    },
    status: row.status,
    verificationMode: row.verification_mode,
    attendanceMode: row.attendance_mode,
    allowManualApproval: row.allow_manual_approval,
    window: {
      scheduledStartAt: row.scheduled_start_at,
      scheduledEndAt: row.scheduled_end_at,
      attendanceOpenAt: row.attendance_open_at,
      lateAfterAt: row.late_after_at,
      attendanceCloseAt: row.attendance_close_at
    }
  };
}

export async function getStudentIdentityByProfile(profileId: string): Promise<StudentIdentity | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('students')
    .select('id, student_code, profiles!inner(id, full_name_th), line_accounts(line_user_id)')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (!data) return null;

  const lineUserId = Array.isArray(data.line_accounts) ? data.line_accounts[0]?.line_user_id ?? '' : '';

  const profileData: any = data.profiles;
  const fullNameTh = Array.isArray(profileData) ? profileData[0]?.full_name_th : profileData?.full_name_th;

  return {
    profileId,
    studentId: data.id,
    studentCode: data.student_code,
    fullNameTh: fullNameTh ?? '-',
    lineUserId,
    role: 'student'
  };
}

export async function getStudentSessions(profileId: string) {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return [];

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('student_enrollments')
    .select(`
      class_sessions:class_sessions!inner(
        id,status,verification_mode,attendance_mode,allow_manual_approval,
        scheduled_start_at,scheduled_end_at,attendance_open_at,late_after_at,attendance_close_at,
        rooms(id,name_th,latitude,longitude,default_radius_m,gps_policy),
        teachers(id,profiles(full_name_th)),
        course_sections(id,section_code,courses(course_code,name_th))
      )
    `)
    .eq('student_id', identity.studentId);

  const rows = (data ?? []).map((row: any) => row.class_sessions).filter(Boolean);
  return rows.map(mapSession);
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

  return data ? mapSession(data) : null;
}

export async function isStudentEnrolled(profileId: string, sessionId: string): Promise<boolean> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) return false;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('student_enrollments')
    .select('id')
    .eq('student_id', identity.studentId)
    .eq('class_session_id', sessionId)
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

  return data?.status;
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
    const { error: upsertError } = await admin.from('attendance_records').upsert({
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
    }, { onConflict: 'class_session_id,student_id' });

    if (upsertError) throw upsertError;
  }
}

export async function getStudentDashboard(profileId: string): Promise<StudentDashboardData> {
  const identity = await getStudentIdentityByProfile(profileId);
  if (!identity) {
    throw new Error('Student profile not found');
  }

  const [activeSessions, history] = await Promise.all([
    getStudentSessions(profileId),
    getStudentHistory(profileId)
  ]);

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
        id,scheduled_start_at,
        course_sections(section_code,courses(course_code,name_th))
      )
    `)
    .eq('student_id', identity.studentId)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((row: any) => {
    const date = row.checked_in_at ? new Date(row.checked_in_at) : null;
    return {
      recordId: row.id,
      sessionId: row.class_sessions.id,
      dateLabel: date ? date.toLocaleDateString('th-TH') : '-',
      courseLabel: `${row.class_sessions.course_sections.courses.course_code} · ${row.class_sessions.course_sections.courses.name_th}`,
      status: row.status,
      checkedInAt: row.checked_in_at,
      note: row.note ?? undefined
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
  const profileRow = Array.isArray(data?.profiles) ? data?.profiles[0] : data?.profiles;
  if (!data || !profileRow || profileRow.status !== 'active') return null;

  return {
    profileId: data.profile_id,
    lineUserId: data.line_user_id,
    role: mapRole(profileRow.role)
  };
}

function mapRole(role: string) {
  return role === 'teacher' || role === 'admin' || role === 'super_admin' ? role : 'student';
}
