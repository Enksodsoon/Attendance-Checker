import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AdminAuditLogItem,
  AdminCourseSection,
  AdminExportItem,
  AdminRoomRecord,
  AdminSessionRecord,
  AdminStudentRecord,
  AdminUserRecord,
  AttendanceDecision,
  AttendanceHistoryItem,
  AttendanceStatus,
  DemoAccount,
  EnrollmentRecord,
  ManualApprovalQueueItem,
  RoomLocation,
  SessionSummary,
  StudentDashboardData,
  StudentIdentity,
  StudentRecord,
  TeacherMonitorData,
  TeacherRosterRow,
  TeacherSessionListItem,
  TeacherRecord,
  UserProfile
} from '@/lib/types';
import { encodeQrPayload, generateQrToken } from '@/lib/utils/qr';

interface SectionState {
  sectionId: string;
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  semesterLabel: string;
  teacherProfileId: string;
  roomId: string;
}

interface SessionState {
  sessionId: string;
  sectionId: string;
  status: SessionSummary['status'];
  verificationMode: SessionSummary['verificationMode'];
  attendanceMode: SessionSummary['attendanceMode'];
  allowManualApproval: boolean;
  window: SessionSummary['window'];
}

interface AttendanceRecordState {
  recordId: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  checkedInAt?: string;
  note?: string;
  distanceM?: number;
  accuracyM?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface AttendanceAttemptState {
  attemptId: string;
  sessionId: string;
  studentId: string;
  studentCode: string;
  fullNameTh: string;
  decision: AttendanceDecision;
  createdAt: string;
}

interface AppState {
  profiles: UserProfile[];
  students: StudentRecord[];
  teachers: TeacherRecord[];
  rooms: RoomLocation[];
  sections: SectionState[];
  sessions: SessionState[];
  enrollments: EnrollmentRecord[];
  qrTokens: Record<string, string>;
  records: AttendanceRecordState[];
  attempts: Record<string, AttendanceAttemptState>;
  manualApprovalQueue: ManualApprovalQueueItem[];
  auditLogs: AdminAuditLogItem[];
}

const DATA_DIR = join(process.cwd(), 'data');
const STATE_FILE = join(DATA_DIR, 'app-state.json');
const DEFAULT_TEACHER_PROFILE_ID = 'profile-teacher-01';

declare global {
  var __attendanceCheckerState: AppState | undefined;
}

function cacheState(state: AppState) {
  globalThis.__attendanceCheckerState = clone(state);
}

function getCachedState() {
  return globalThis.__attendanceCheckerState ? clone(globalThis.__attendanceCheckerState) : null;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function buildWindow(offsetMinutes: number, durationMinutes: number) {
  const now = new Date();
  const scheduledStart = new Date(now.getTime() + offsetMinutes * 60 * 1000);
  const attendanceOpen = new Date(scheduledStart.getTime() - 15 * 60 * 1000);
  const lateAfter = new Date(scheduledStart.getTime() + 10 * 60 * 1000);
  const attendanceClose = new Date(scheduledStart.getTime() + 45 * 60 * 1000);
  const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

  return {
    scheduledStartAt: scheduledStart.toISOString(),
    scheduledEndAt: scheduledEnd.toISOString(),
    attendanceOpenAt: attendanceOpen.toISOString(),
    lateAfterAt: lateAfter.toISOString(),
    attendanceCloseAt: attendanceClose.toISOString()
  };
}

function buildInitialState(): AppState {
  const openWindow = buildWindow(-10, 120);
  const nextWindow = buildWindow(120, 120);
  const closedWindow = buildWindow(-240, 120);

  const profiles: UserProfile[] = [
    {
      profileId: 'profile-admin-01',
      name: 'พิมพ์ชนก อนันตกุล',
      email: 'admin.registrar@university.ac.th',
      role: 'super_admin',
      status: 'active',
      lastActiveAt: nowIso()
    },
    {
      profileId: DEFAULT_TEACHER_PROFILE_ID,
      name: 'รศ.ดร.ชลธิชา สุวรรณกิจ',
      email: 'cholthicha@university.ac.th',
      role: 'teacher',
      status: 'active',
      lastActiveAt: nowIso(),
      teacherId: 'teacher-01'
    },
    {
      profileId: 'profile-teacher-02',
      name: 'ผศ.ดร.ธนัชพร กิตติพงษ์',
      email: 'thanatchaporn@university.ac.th',
      role: 'teacher',
      status: 'active',
      lastActiveAt: nowIso(),
      teacherId: 'teacher-02'
    },
    {
      profileId: 'profile-student-650610001',
      name: 'ศิริกร วัฒนกูล',
      email: '650610001@university.ac.th',
      role: 'student',
      status: 'active',
      lastActiveAt: nowIso(),
      studentId: 'student-650610001',
      lineUserId: 'U5c8a2d18f1a9b23011'
    },
    {
      profileId: 'profile-student-650610002',
      name: 'ปาริชาติ แก้วกัลยา',
      email: '650610002@university.ac.th',
      role: 'student',
      status: 'active',
      lastActiveAt: nowIso(),
      studentId: 'student-650610002',
      lineUserId: 'U5c8a2d18f1a9b23012'
    },
    {
      profileId: 'profile-student-650610003',
      name: 'ณัฐพงศ์ มณีรัตน์',
      email: '650610003@university.ac.th',
      role: 'student',
      status: 'active',
      lastActiveAt: nowIso(),
      studentId: 'student-650610003',
      lineUserId: 'U5c8a2d18f1a9b23013'
    }
  ];

  const students: StudentRecord[] = [
    {
      studentId: 'student-650610001',
      profileId: 'profile-student-650610001',
      studentCode: '650610001',
      fullNameTh: 'ศิริกร วัฒนกูล',
      facultyName: 'คณะวิศวกรรมศาสตร์',
      departmentName: 'วิศวกรรมซอฟต์แวร์',
      yearLevel: 4,
      status: 'active',
      lineUserId: 'U5c8a2d18f1a9b23011'
    },
    {
      studentId: 'student-650610002',
      profileId: 'profile-student-650610002',
      studentCode: '650610002',
      fullNameTh: 'ปาริชาติ แก้วกัลยา',
      facultyName: 'คณะวิศวกรรมศาสตร์',
      departmentName: 'วิศวกรรมซอฟต์แวร์',
      yearLevel: 4,
      status: 'active',
      lineUserId: 'U5c8a2d18f1a9b23012'
    },
    {
      studentId: 'student-650610003',
      profileId: 'profile-student-650610003',
      studentCode: '650610003',
      fullNameTh: 'ณัฐพงศ์ มณีรัตน์',
      facultyName: 'คณะวิศวกรรมศาสตร์',
      departmentName: 'วิศวกรรมซอฟต์แวร์',
      yearLevel: 4,
      status: 'active',
      lineUserId: 'U5c8a2d18f1a9b23013'
    }
  ];

  const teachers: TeacherRecord[] = [
    { teacherId: 'teacher-01', profileId: DEFAULT_TEACHER_PROFILE_ID, fullNameTh: 'รศ.ดร.ชลธิชา สุวรรณกิจ' },
    { teacherId: 'teacher-02', profileId: 'profile-teacher-02', fullNameTh: 'ผศ.ดร.ธนัชพร กิตติพงษ์' }
  ];

  const rooms: RoomLocation[] = [
    {
      roomId: 'ENG-B520',
      roomName: 'อาคารวิศวกรรม ห้อง B520',
      latitude: 13.736717,
      longitude: 100.523186,
      defaultRadiusM: 180,
      gpsPolicy: 'allow_manual_approval'
    },
    {
      roomId: 'SCI-S401',
      roomName: 'อาคารวิทยาศาสตร์ ห้อง S401',
      latitude: 13.737401,
      longitude: 100.52254,
      defaultRadiusM: 150,
      gpsPolicy: 'strict'
    }
  ];

  const sections: SectionState[] = [
    {
      sectionId: 'cs401-sec1-2568',
      courseCode: 'CS401',
      courseNameTh: 'วิศวกรรมซอฟต์แวร์ระดับองค์กร',
      sectionCode: '1',
      semesterLabel: 'ภาคการศึกษาที่ 2/2568',
      teacherProfileId: DEFAULT_TEACHER_PROFILE_ID,
      roomId: 'ENG-B520'
    },
    {
      sectionId: 'cs305-sec2-2568',
      courseCode: 'CS305',
      courseNameTh: 'ฐานข้อมูลขั้นสูง',
      sectionCode: '2',
      semesterLabel: 'ภาคการศึกษาที่ 2/2568',
      teacherProfileId: 'profile-teacher-02',
      roomId: 'SCI-S401'
    }
  ];

  const sessions: SessionState[] = [
    {
      sessionId: 'cs401-sec1-open',
      sectionId: 'cs401-sec1-2568',
      status: 'open',
      verificationMode: 'gps_qr_timewindow',
      attendanceMode: 'check_in_only',
      allowManualApproval: true,
      window: openWindow
    },
    {
      sessionId: 'cs305-sec2-next',
      sectionId: 'cs305-sec2-2568',
      status: 'draft',
      verificationMode: 'gps_qr_timewindow',
      attendanceMode: 'check_in_only',
      allowManualApproval: true,
      window: nextWindow
    },
    {
      sessionId: 'cs305-sec2-prev',
      sectionId: 'cs305-sec2-2568',
      status: 'closed',
      verificationMode: 'gps_qr_timewindow',
      attendanceMode: 'check_in_only',
      allowManualApproval: true,
      window: closedWindow
    }
  ];

  const enrollments: EnrollmentRecord[] = [
    { enrollmentId: 'enroll-1', studentId: 'student-650610001', sectionId: 'cs401-sec1-2568' },
    { enrollmentId: 'enroll-2', studentId: 'student-650610002', sectionId: 'cs401-sec1-2568' },
    { enrollmentId: 'enroll-3', studentId: 'student-650610003', sectionId: 'cs401-sec1-2568' },
    { enrollmentId: 'enroll-4', studentId: 'student-650610001', sectionId: 'cs305-sec2-2568' },
    { enrollmentId: 'enroll-5', studentId: 'student-650610002', sectionId: 'cs305-sec2-2568' }
  ];

  const qrTokens = {
    'cs401-sec1-open': 'CS401-B520-CHECKIN',
    'cs305-sec2-next': generateQrToken(),
    'cs305-sec2-prev': generateQrToken()
  };

  const records: AttendanceRecordState[] = [
    {
      recordId: 'record-cs305-prev-student1',
      sessionId: 'cs305-sec2-prev',
      studentId: 'student-650610001',
      status: 'present',
      checkedInAt: new Date(new Date(closedWindow.scheduledStartAt).getTime() + 4 * 60 * 1000).toISOString(),
      distanceM: 14,
      accuracyM: 18,
      approvalStatus: 'approved'
    },
    {
      recordId: 'record-cs305-prev-student2',
      sessionId: 'cs305-sec2-prev',
      studentId: 'student-650610002',
      status: 'late',
      checkedInAt: new Date(new Date(closedWindow.scheduledStartAt).getTime() + 18 * 60 * 1000).toISOString(),
      distanceM: 21,
      accuracyM: 24,
      approvalStatus: 'approved'
    },
    {
      recordId: 'record-open-student2',
      sessionId: 'cs401-sec1-open',
      studentId: 'student-650610002',
      status: 'present',
      checkedInAt: new Date(new Date(openWindow.scheduledStartAt).getTime() + 3 * 60 * 1000).toISOString(),
      distanceM: 12,
      accuracyM: 15,
      approvalStatus: 'approved'
    },
    {
      recordId: 'record-open-student3',
      sessionId: 'cs401-sec1-open',
      studentId: 'student-650610003',
      status: 'late',
      checkedInAt: new Date(new Date(openWindow.scheduledStartAt).getTime() + 16 * 60 * 1000).toISOString(),
      distanceM: 25,
      accuracyM: 20,
      approvalStatus: 'approved'
    }
  ];

  return {
    profiles,
    students,
    teachers,
    rooms,
    sections,
    sessions,
    enrollments,
    qrTokens,
    records,
    attempts: {},
    manualApprovalQueue: [],
    auditLogs: [
      {
        id: 'audit-seed-1',
        occurredAt: nowIso(),
        actorProfileId: 'profile-admin-01',
        actorLabel: 'พิมพ์ชนก อนันตกุล',
        actionType: 'system.seed_loaded',
        entityType: 'system',
        entityId: 'demo-state',
        metadata: { profiles: profiles.length, sessions: sessions.length }
      }
    ]
  };
}

function saveState(state: AppState) {
  cacheState(state);

  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.warn('[app-data] Falling back to in-memory state store.', error);
  }
}

function getState() {
  const cached = getCachedState();
  if (cached) {
    return cached;
  }

  if (existsSync(STATE_FILE)) {
    const fileState = JSON.parse(readFileSync(STATE_FILE, 'utf-8')) as AppState;
    cacheState(fileState);
    return clone(fileState);
  }

  const initial = buildInitialState();
  saveState(initial);
  return clone(initial);
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getProfileOrThrow(state: AppState, profileId: string) {
  const profile = state.profiles.find((item) => item.profileId === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  return profile;
}

function getStudentByProfileId(state: AppState, profileId: string) {
  const profile = state.profiles.find((item) => item.profileId === profileId && item.role === 'student');
  if (!profile?.studentId) {
    return null;
  }

  return state.students.find((item) => item.studentId === profile.studentId) ?? null;
}

function getSection(state: AppState, sectionId: string) {
  return state.sections.find((item) => item.sectionId === sectionId) ?? null;
}

function getSessionState(state: AppState, sessionId: string) {
  return state.sessions.find((item) => item.sessionId === sessionId) ?? null;
}

function getRoom(state: AppState, roomId: string) {
  return state.rooms.find((item) => item.roomId === roomId) ?? null;
}

function getTeacherName(state: AppState, teacherProfileId: string) {
  return state.profiles.find((item) => item.profileId === teacherProfileId)?.name ?? 'ไม่ระบุผู้สอน';
}

function buildSessionSummary(state: AppState, sessionState: SessionState): SessionSummary {
  const section = getSection(state, sessionState.sectionId);
  if (!section) {
    throw new Error(`Section not found: ${sessionState.sectionId}`);
  }

  const room = getRoom(state, section.roomId);
  if (!room) {
    throw new Error(`Room not found: ${section.roomId}`);
  }

  return {
    sessionId: sessionState.sessionId,
    courseCode: section.courseCode,
    courseNameTh: section.courseNameTh,
    sectionCode: section.sectionCode,
    teacherName: getTeacherName(state, section.teacherProfileId),
    room,
    status: sessionState.status,
    verificationMode: sessionState.verificationMode,
    attendanceMode: sessionState.attendanceMode,
    allowManualApproval: sessionState.allowManualApproval,
    window: sessionState.window
  };
}

function buildStudentIdentity(student: StudentRecord): StudentIdentity {
  return {
    profileId: student.profileId,
    studentId: student.studentId,
    studentCode: student.studentCode,
    fullNameTh: student.fullNameTh,
    lineUserId: student.lineUserId ?? '',
    role: 'student'
  };
}

function getStudentSessionsInternal(state: AppState, studentId: string) {
  const sectionIds = new Set(state.enrollments.filter((item) => item.studentId === studentId).map((item) => item.sectionId));
  return state.sessions
    .filter((session) => sectionIds.has(session.sectionId))
    .sort((a, b) => new Date(a.window.scheduledStartAt).getTime() - new Date(b.window.scheduledStartAt).getTime())
    .map((session) => buildSessionSummary(state, session));
}

function getTeacherSessionsInternal(state: AppState, teacherProfileId: string) {
  const ownedSectionIds = new Set(state.sections.filter((item) => item.teacherProfileId === teacherProfileId).map((item) => item.sectionId));
  return state.sessions
    .filter((item) => ownedSectionIds.has(item.sectionId))
    .sort((a, b) => new Date(a.window.scheduledStartAt).getTime() - new Date(b.window.scheduledStartAt).getTime());
}

function buildHistoryForStudent(state: AppState, studentId: string): AttendanceHistoryItem[] {
  const items: AttendanceHistoryItem[] = [];

  for (const record of state.records.filter((item) => item.studentId === studentId)) {
    const session = getSessionState(state, record.sessionId);
    if (!session) {
      continue;
    }

    const summary = buildSessionSummary(state, session);
    items.push({
      recordId: record.recordId,
      sessionId: record.sessionId,
      dateLabel: formatDateLabel(record.checkedInAt ?? summary.window.scheduledStartAt),
      courseLabel: `${summary.courseCode} / ตอน ${summary.sectionCode}`,
      status: record.status,
      checkedInAt: record.checkedInAt,
      note: record.note
    });
  }

  return items.sort((a, b) => new Date(b.checkedInAt ?? 0).getTime() - new Date(a.checkedInAt ?? 0).getTime());
}

function buildStudentSummary(state: AppState, studentId: string) {
  const records = state.records.filter((item) => item.studentId === studentId);
  return {
    totalPresent: records.filter((item) => item.status === 'present').length,
    totalLate: records.filter((item) => item.status === 'late').length,
    totalPending: records.filter((item) => item.status === 'pending_approval').length,
    totalAbsent: records.filter((item) => item.status === 'absent' || item.status === 'rejected').length
  };
}

function getEnrollmentCountForSection(state: AppState, sectionId: string) {
  return state.enrollments.filter((item) => item.sectionId === sectionId).length;
}

function buildRoster(state: AppState, sessionId: string) {
  const session = getSessionState(state, sessionId);
  if (!session) {
    return [] as TeacherRosterRow[];
  }

  const enrollments = state.enrollments.filter((item) => item.sectionId === session.sectionId);
  return enrollments.map((enrollment) => {
    const student = state.students.find((item) => item.studentId === enrollment.studentId);
    if (!student) {
      throw new Error(`Student not found for enrollment ${enrollment.enrollmentId}`);
    }

    const record = state.records.find((item) => item.sessionId === sessionId && item.studentId === student.studentId);
    return {
      studentId: student.studentId,
      studentCode: student.studentCode,
      fullNameTh: student.fullNameTh,
      status: record?.status ?? 'absent',
      checkedInAt: record?.checkedInAt
        ? new Date(record.checkedInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        : undefined,
      distanceM: record?.distanceM ? Math.round(record.distanceM) : undefined,
      accuracyM: record?.accuracyM ? Math.round(record.accuracyM) : undefined,
      approvalStatus: record?.approvalStatus
    } satisfies TeacherRosterRow;
  });
}

function buildMetrics(roster: TeacherRosterRow[]) {
  const present = roster.filter((item) => item.status === 'present').length;
  const late = roster.filter((item) => item.status === 'late').length;
  const pendingApproval = roster.filter((item) => item.status === 'pending_approval').length;
  const absent = roster.filter((item) => item.status === 'absent' || item.status === 'rejected').length;
  return { present, late, pendingApproval, absent };
}

function upsertRecord(state: AppState, input: AttendanceRecordState) {
  const existing = state.records.find((item) => item.sessionId === input.sessionId && item.studentId === input.studentId);
  if (existing) {
    Object.assign(existing, input);
    return existing;
  }

  state.records.unshift(input);
  return input;
}

function resolveActorLabel(profileId?: string) {
  const state = getState();
  if (!profileId) {
    return 'system';
  }

  return state.profiles.find((item) => item.profileId === profileId)?.name ?? 'system';
}

export function getDemoAccounts(): DemoAccount[] {
  return clone(
    getState().profiles.map((profile) => ({
      profileId: profile.profileId,
      name: profile.name,
      role: profile.role,
      status: profile.status,
      email: profile.email,
      description:
        profile.role === 'student'
          ? 'ทดลอง flow bind, เลือกคาบ, สแกน QR, และดูประวัติ'
          : profile.role === 'teacher'
            ? 'ทดลองเปิด/ปิดคาบ, หมุน QR, ดู roster และอนุมัติคำขอ'
            : 'ทดลองจัดการข้อมูล master data, นักศึกษา, รายวิชา, ห้อง และ audit'
    }))
  );
}

export function getProfile(profileId: string) {
  const state = getState();
  const profile = state.profiles.find((item) => item.profileId === profileId);
  return profile ? clone(profile) : null;
}

export function getStudentDashboard(profileId: string): StudentDashboardData {
  const state = getState();
  const student = getStudentByProfileId(state, profileId);
  if (!student) {
    throw new Error('Student session not found');
  }

  return clone({
    student: buildStudentIdentity(student),
    activeSessions: getStudentSessionsInternal(state, student.studentId).filter((item) => item.status === 'open' || item.status === 'draft'),
    summary: buildStudentSummary(state, student.studentId),
    recentHistory: buildHistoryForStudent(state, student.studentId)
  });
}

export function getStudentSessionOptions(profileId: string) {
  const state = getState();
  const student = getStudentByProfileId(state, profileId);
  if (!student) {
    return [];
  }

  return clone(getStudentSessionsInternal(state, student.studentId));
}

export function getTeacherSessions(profileId: string): TeacherSessionListItem[] {
  const state = getState();
  return clone(
    getTeacherSessionsInternal(state, profileId).map((session) => {
      const summary = buildSessionSummary(state, session);
      const roster = buildRoster(state, session.sessionId);
      return {
        ...summary,
        metrics: buildMetrics(roster)
      };
    })
  );
}

export function getTeacherMonitorData(sessionId: string): TeacherMonitorData | null {
  const state = getState();
  const session = getSessionState(state, sessionId);
  if (!session) {
    return null;
  }

  const roster = buildRoster(state, sessionId);
  return clone({
    session: buildSessionSummary(state, session),
    qrPayload: encodeQrPayload({ sessionId, token: state.qrTokens[sessionId] ?? generateQrToken() }),
    metrics: buildMetrics(roster),
    roster
  });
}

export function isTeacherAssignedToSession(profileId: string, sessionId: string) {
  const state = getState();
  const session = getSessionState(state, sessionId);
  if (!session) {
    return false;
  }

  return state.sections.some((section) => section.sectionId === session.sectionId && section.teacherProfileId === profileId);
}

export function canManageManualApprovalRequest(profileId: string, attemptId: string) {
  const attempt = getState().attempts[attemptId];
  if (!attempt) {
    return false;
  }

  return isTeacherAssignedToSession(profileId, attempt.sessionId);
}

export function getTeacherPrimarySessionRoute(profileId: string) {
  const sessions = getTeacherSessions(profileId);
  return sessions[0] ? `/teacher/sessions/${sessions[0].sessionId}` : '/teacher/sessions';
}

export function getCurrentQrToken(sessionId: string) {
  return getState().qrTokens[sessionId] ?? null;
}

export function refreshCurrentQrToken(sessionId: string) {
  const state = getState();
  if (!getSessionState(state, sessionId)) {
    return null;
  }

  state.qrTokens[sessionId] = generateQrToken();
  saveState(state);
  return state.qrTokens[sessionId];
}

export function updateSessionStatus(sessionId: string, status: SessionSummary['status']) {
  const state = getState();
  const session = getSessionState(state, sessionId);
  if (!session) {
    return null;
  }

  session.status = status;
  saveState(state);
  return buildSessionSummary(state, session);
}

export function getSessionById(sessionId: string) {
  const state = getState();
  const session = getSessionState(state, sessionId);
  return session ? clone(buildSessionSummary(state, session)) : null;
}

export function isStudentEnrolled(profileId: string, sessionId: string) {
  const state = getState();
  const student = getStudentByProfileId(state, profileId);
  const session = getSessionState(state, sessionId);
  if (!student || !session) {
    return false;
  }

  return state.enrollments.some((item) => item.sectionId === session.sectionId && item.studentId === student.studentId);
}

export function getExistingRecordStatus(profileId: string, sessionId: string) {
  const state = getState();
  const student = getStudentByProfileId(state, profileId);
  if (!student) {
    return undefined;
  }

  return state.records.find((item) => item.sessionId === sessionId && item.studentId === student.studentId)?.status;
}

export function recordCheckInAttempt(input: {
  profileId: string;
  sessionId: string;
  attemptId: string;
  decision: AttendanceDecision;
  submittedAt: string;
}) {
  const state = getState();
  const student = getStudentByProfileId(state, input.profileId);
  if (!student) {
    throw new Error('Student session not found');
  }

  state.attempts[input.attemptId] = {
    attemptId: input.attemptId,
    sessionId: input.sessionId,
    studentId: student.studentId,
    studentCode: student.studentCode,
    fullNameTh: student.fullNameTh,
    decision: input.decision,
    createdAt: input.submittedAt
  };

  if (input.decision.status === 'present' || input.decision.status === 'late' || input.decision.status === 'pending_approval') {
    upsertRecord(state, {
      recordId: `record-${input.sessionId}-${student.studentId}`,
      sessionId: input.sessionId,
      studentId: student.studentId,
      status: input.decision.status,
      checkedInAt: input.decision.verificationResult === 'accepted' ? input.submittedAt : undefined,
      note: input.decision.requiresManualApproval ? 'รอ manual approval' : undefined,
      distanceM: input.decision.distanceFromCenterM,
      accuracyM: input.decision.finalAccuracyM,
      approvalStatus: input.decision.status === 'pending_approval' ? 'pending' : 'approved'
    });
  }

  saveState(state);
}

export function createManualApprovalRequest(input: {
  profileId: string;
  sessionId: string;
  attendanceAttemptId: string;
  reasonText: string;
}) {
  const state = getState();
  const attempt = state.attempts[input.attendanceAttemptId];
  const student = getStudentByProfileId(state, input.profileId);

  if (!attempt || !student || attempt.sessionId !== input.sessionId || attempt.studentId !== student.studentId) {
    return null;
  }

  const canRequestManualApproval = attempt.decision.requiresManualApproval || attempt.decision.verificationResult === 'pending_approval';
  if (!canRequestManualApproval) {
    return null;
  }

  const existing = state.manualApprovalQueue.find((item) => item.attemptId === input.attendanceAttemptId);
  if (existing) {
    return clone(existing);
  }

  const queueItem: ManualApprovalQueueItem = {
    attemptId: input.attendanceAttemptId,
    sessionId: input.sessionId,
    studentCode: attempt.studentCode,
    fullNameTh: attempt.fullNameTh,
    reasonText: input.reasonText,
    requestedAt: nowIso(),
    status: 'pending'
  };

  state.manualApprovalQueue.unshift(queueItem);

  const record = state.records.find((item) => item.sessionId === input.sessionId && item.studentId === attempt.studentId);
  if (record) {
    record.status = 'pending_approval';
    record.approvalStatus = 'pending';
    record.note = input.reasonText;
  }

  saveState(state);
  return clone(queueItem);
}

export function resolveManualApprovalRequest(input: { attemptId: string; status: 'approved' | 'rejected' }) {
  const state = getState();
  const queueItem = state.manualApprovalQueue.find((item) => item.attemptId === input.attemptId);
  if (!queueItem) {
    return null;
  }

  queueItem.status = input.status;
  const attempt = state.attempts[input.attemptId];
  if (attempt) {
    const record = state.records.find((item) => item.sessionId === attempt.sessionId && item.studentId === attempt.studentId);
    if (record) {
      record.status = input.status === 'approved' ? 'present' : 'rejected';
      record.approvalStatus = input.status;
      record.note = `${queueItem.reasonText} · ผลการพิจารณา: ${input.status}`;
      if (input.status === 'approved' && !record.checkedInAt) {
        record.checkedInAt = attempt.createdAt;
      }
    }
  }

  saveState(state);
  return clone(queueItem);
}

export function getManualApprovalQueue(sessionId?: string) {
  const items = getState().manualApprovalQueue;
  return clone(sessionId ? items.filter((item) => item.sessionId === sessionId) : items);
}

export function getSessionOverview(sessionId?: string) {
  const state = getState();
  const picked = sessionId ?? state.sessions.find((item) => item.status === 'open')?.sessionId ?? state.sessions[0]?.sessionId;
  if (!picked) {
    return null;
  }

  return {
    monitor: getTeacherMonitorData(picked),
    manualApprovalQueue: getManualApprovalQueue(picked),
    qrToken: getCurrentQrToken(picked)
  };
}

export function getAdminUsers() {
  const state = getState();
  return clone(
    state.profiles.map((profile) => ({
      profileId: profile.profileId,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      lastActiveAt: profile.lastActiveAt,
      linkedStudentCode: profile.studentId ? state.students.find((item) => item.studentId === profile.studentId)?.studentCode : undefined,
      lineUserId: profile.lineUserId
    }))
  ) as AdminUserRecord[];
}

export function getAdminStudents() {
  const state = getState();
  return clone(
    state.students.map((student) => ({
      ...student,
      email: state.profiles.find((profile) => profile.profileId === student.profileId)?.email ?? '',
      enrolledSectionIds: state.enrollments.filter((item) => item.studentId === student.studentId).map((item) => item.sectionId)
    }))
  ) as AdminStudentRecord[];
}

export function getAdminCourses() {
  const state = getState();
  return clone(
    state.sections.map((section) => ({
      sectionId: section.sectionId,
      courseCode: section.courseCode,
      courseNameTh: section.courseNameTh,
      sectionCode: section.sectionCode,
      semesterLabel: section.semesterLabel,
      teacherProfileId: section.teacherProfileId,
      teacherName: getTeacherName(state, section.teacherProfileId),
      roomId: section.roomId,
      roomName: getRoom(state, section.roomId)?.roomName ?? section.roomId,
      activeSessionId: state.sessions.find((item) => item.sectionId === section.sectionId && item.status === 'open')?.sessionId,
      enrolledCount: getEnrollmentCountForSection(state, section.sectionId)
    }))
  ) as AdminCourseSection[];
}

function buildAdminSessionRecord(state: AppState, session: SessionState): AdminSessionRecord {
  const summary = buildSessionSummary(state, session);
  return {
    ...summary,
    sectionId: session.sectionId
  };
}

export function getAdminSessions() {
  const state = getState();
  return clone(
    state.sessions
      .slice()
      .sort((a, b) => new Date(b.window.scheduledStartAt).getTime() - new Date(a.window.scheduledStartAt).getTime())
      .map((session) => buildAdminSessionRecord(state, session))
  ) as AdminSessionRecord[];
}

export function getAdminRooms() {
  const state = getState();
  return clone(
    state.rooms.map((room) => ({
      roomId: room.roomId,
      roomName: room.roomName,
      latitude: room.latitude,
      longitude: room.longitude,
      radiusM: room.defaultRadiusM,
      gpsPolicy: room.gpsPolicy,
      activeSessionId: state.sections
        .filter((item) => item.roomId === room.roomId)
        .flatMap((section) => state.sessions.filter((session) => session.sectionId === section.sectionId && session.status === 'open').map((session) => session.sessionId))[0]
    }))
  ) as AdminRoomRecord[];
}

export function getEnrollments() {
  return clone(getState().enrollments);
}

export function getAdminExports(): AdminExportItem[] {
  const state = getState();
  const primarySession = state.sessions.find((item) => item.status === 'open')?.sessionId ?? state.sessions[0]?.sessionId ?? 'session';
  return [
    {
      id: 'attendance-csv',
      label: 'ดาวน์โหลดรายชื่อเช็กชื่อ (CSV)',
      description: 'ส่งออกข้อมูลเช็กชื่อของคาบที่เลือกอยู่ในรูปแบบ CSV',
      href: `/api/teacher/sessions/${primarySession}/export`
    },
    {
      id: 'audit-json',
      label: 'ดาวน์โหลด audit log (JSON)',
      description: 'ตรวจสอบประวัติการเช็กชื่อ การ bind และคำขออนุมัติย้อนหลัง',
      href: '/api/admin/audit-logs'
    },
    {
      id: 'monitor-json',
      label: 'เปิด session monitor payload',
      description: 'ดู payload เดียวกับที่หน้า live monitor แสดงผล',
      href: `/api/teacher/sessions/${primarySession}/monitor`
    }
  ];
}

export function getAuditLogs() {
  return clone(getState().auditLogs);
}

export function addAdminUser(input: { name: string; email: string; role: AdminUserRecord['role']; lineUserId?: string }) {
  const state = getState();
  const user: UserProfile = {
    profileId: `profile-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
    status: 'active',
    lastActiveAt: nowIso(),
    lineUserId: input.lineUserId?.trim() || undefined
  };

  state.profiles.unshift(user);
  saveState(state);
  return clone(user);
}

export function updateAdminUser(input: {
  profileId: string;
  name: string;
  email: string;
  role: AdminUserRecord['role'];
  status: UserProfile['status'];
  lineUserId?: string;
}) {
  const state = getState();
  const profile = state.profiles.find((item) => item.profileId === input.profileId);
  if (!profile) {
    return null;
  }

  profile.name = input.name;
  profile.email = input.email;
  profile.role = input.role;
  profile.status = input.status;
  profile.lineUserId = input.lineUserId?.trim() || undefined;

  if (profile.studentId) {
    const student = state.students.find((item) => item.studentId === profile.studentId);
    if (student) {
      student.fullNameTh = input.name;
      student.status = input.status;
    }
  }

  saveState(state);
  return clone(profile);
}

export function deleteAdminUser(profileId: string) {
  const state = getState();
  const index = state.profiles.findIndex((item) => item.profileId === profileId);
  if (index === -1) {
    return null;
  }

  const [removed] = state.profiles.splice(index, 1);
  if (removed.studentId) {
    const linkedStudent = state.students.find((item) => item.studentId === removed.studentId);
    state.students = state.students.filter((item) => item.studentId !== removed.studentId);
    state.enrollments = state.enrollments.filter((item) => item.studentId !== removed.studentId);
    state.records = state.records.filter((item) => item.studentId !== removed.studentId);
    state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => item.studentCode !== linkedStudent?.studentCode);
    state.attempts = Object.fromEntries(
      Object.entries(state.attempts).filter(([, attempt]) => attempt.studentId !== removed.studentId)
    );
  }

  if (removed.teacherId) {
    state.teachers = state.teachers.filter((item) => item.teacherId !== removed.teacherId);
    const removedSectionIds = state.sections
      .filter((item) => item.teacherProfileId === removed.profileId)
      .map((item) => item.sectionId);
    const removedSessionIds = state.sessions
      .filter((item) => removedSectionIds.includes(item.sectionId))
      .map((item) => item.sessionId);
    state.sections = state.sections.filter((item) => item.teacherProfileId !== removed.profileId);
    state.sessions = state.sessions.filter((item) => !removedSectionIds.includes(item.sectionId));
    state.enrollments = state.enrollments.filter((item) => !removedSectionIds.includes(item.sectionId));
    state.records = state.records.filter((item) => !removedSessionIds.includes(item.sessionId));
    state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => !removedSessionIds.includes(item.sessionId));
    state.attempts = Object.fromEntries(
      Object.entries(state.attempts).filter(([, attempt]) => !removedSessionIds.includes(attempt.sessionId))
    );
    for (const sessionId of removedSessionIds) {
      delete state.qrTokens[sessionId];
    }
  }

  saveState(state);
  return clone(removed);
}

export function addAdminStudent(input: {
  studentCode: string;
  fullNameTh: string;
  facultyName: string;
  departmentName: string;
  yearLevel: number;
  email?: string;
}) {
  const state = getState();
  const profileId = `profile-student-${Date.now()}`;
  const studentId = `student-${Date.now()}`;
  const email = input.email?.trim() || `${input.studentCode}@university.ac.th`;

  const profile: UserProfile = {
    profileId,
    name: input.fullNameTh,
    email,
    role: 'student',
    status: 'active',
    lastActiveAt: nowIso(),
    studentId
  };
  const student: StudentRecord = {
    studentId,
    profileId,
    studentCode: input.studentCode,
    fullNameTh: input.fullNameTh,
    facultyName: input.facultyName,
    departmentName: input.departmentName,
    yearLevel: input.yearLevel,
    status: 'active'
  };

  state.profiles.unshift(profile);
  state.students.unshift(student);
  saveState(state);
  return clone(student);
}

export function updateAdminStudent(input: {
  studentId: string;
  studentCode: string;
  fullNameTh: string;
  facultyName: string;
  departmentName: string;
  yearLevel: number;
  email?: string;
  status: StudentRecord['status'];
}) {
  const state = getState();
  const student = state.students.find((item) => item.studentId === input.studentId);
  if (!student) {
    return null;
  }

  student.studentCode = input.studentCode;
  student.fullNameTh = input.fullNameTh;
  student.facultyName = input.facultyName;
  student.departmentName = input.departmentName;
  student.yearLevel = input.yearLevel;
  student.status = input.status;

  const profile = state.profiles.find((item) => item.profileId === student.profileId);
  if (profile) {
    profile.name = input.fullNameTh;
    profile.email = input.email?.trim() || `${input.studentCode}@university.ac.th`;
    profile.status = input.status;
  }

  saveState(state);
  return clone(student);
}

export function deleteAdminStudent(studentId: string) {
  const state = getState();
  const student = state.students.find((item) => item.studentId === studentId);
  if (!student) {
    return null;
  }

  state.students = state.students.filter((item) => item.studentId !== studentId);
  state.profiles = state.profiles.filter((item) => item.profileId !== student.profileId);
  state.enrollments = state.enrollments.filter((item) => item.studentId !== studentId);
  state.records = state.records.filter((item) => item.studentId !== studentId);
  state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => item.studentCode !== student.studentCode);
  state.attempts = Object.fromEntries(
    Object.entries(state.attempts).filter(([, attempt]) => attempt.studentId !== studentId)
  );

  saveState(state);
  return clone(student);
}

export function addAdminCourse(input: {
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  semesterLabel: string;
  teacherProfileId: string;
  roomId: string;
  sessionStatus?: SessionSummary['status'];
}) {
  const state = getState();
  const sectionId = `section-${Date.now()}`;
  const sessionId = `session-${Date.now()}`;
  const section: SectionState = {
    sectionId,
    courseCode: input.courseCode,
    courseNameTh: input.courseNameTh,
    sectionCode: input.sectionCode,
    semesterLabel: input.semesterLabel,
    teacherProfileId: input.teacherProfileId,
    roomId: input.roomId
  };
  const session: SessionState = {
    sessionId,
    sectionId,
    status: input.sessionStatus ?? 'draft',
    verificationMode: 'gps_qr_timewindow',
    attendanceMode: 'check_in_only',
    allowManualApproval: true,
    window: buildWindow(180, 120)
  };

  state.sections.unshift(section);
  state.sessions.unshift(session);
  state.qrTokens[sessionId] = generateQrToken();
  saveState(state);
  return clone(buildSessionSummary(state, session));
}

export function addAdminSession(input: {
  sectionId: string;
  status: SessionSummary['status'];
  allowManualApproval: boolean;
  window: SessionSummary['window'];
}) {
  const state = getState();
  const section = state.sections.find((item) => item.sectionId === input.sectionId);
  if (!section) {
    return null;
  }

  const session: SessionState = {
    sessionId: `session-${Date.now()}`,
    sectionId: input.sectionId,
    status: input.status,
    verificationMode: 'gps_qr_timewindow',
    attendanceMode: 'check_in_only',
    allowManualApproval: input.allowManualApproval,
    window: input.window
  };

  state.sessions.unshift(session);
  state.qrTokens[session.sessionId] = generateQrToken();
  saveState(state);
  return clone(buildAdminSessionRecord(state, session));
}

export function updateAdminCourse(input: {
  sectionId: string;
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  semesterLabel: string;
  teacherProfileId: string;
  roomId: string;
  sessionStatus?: SessionSummary['status'];
}) {
  const state = getState();
  const section = state.sections.find((item) => item.sectionId === input.sectionId);
  if (!section) {
    return null;
  }

  section.courseCode = input.courseCode;
  section.courseNameTh = input.courseNameTh;
  section.sectionCode = input.sectionCode;
  section.semesterLabel = input.semesterLabel;
  section.teacherProfileId = input.teacherProfileId;
  section.roomId = input.roomId;

  const session = state.sessions.find((item) => item.sectionId === input.sectionId);
  if (session && input.sessionStatus) {
    session.status = input.sessionStatus;
  }

  saveState(state);
  return clone(
    session ? buildSessionSummary(state, session) : buildSessionSummary(state, {
      sessionId: `virtual-${section.sectionId}`,
      sectionId: section.sectionId,
      status: input.sessionStatus ?? 'draft',
      verificationMode: 'gps_qr_timewindow',
      attendanceMode: 'check_in_only',
      allowManualApproval: true,
      window: buildWindow(180, 120)
    })
  );
}

export function updateAdminSession(input: {
  sessionId: string;
  status: SessionSummary['status'];
  allowManualApproval: boolean;
  window: SessionSummary['window'];
}) {
  const state = getState();
  const session = state.sessions.find((item) => item.sessionId === input.sessionId);
  if (!session) {
    return null;
  }

  session.status = input.status;
  session.allowManualApproval = input.allowManualApproval;
  session.window = input.window;

  saveState(state);
  return clone(buildAdminSessionRecord(state, session));
}

export function deleteAdminCourse(sectionId: string) {
  const state = getState();
  const section = state.sections.find((item) => item.sectionId === sectionId);
  if (!section) {
    return null;
  }

  const sessionIds = state.sessions.filter((item) => item.sectionId === sectionId).map((item) => item.sessionId);
  state.sections = state.sections.filter((item) => item.sectionId !== sectionId);
  state.sessions = state.sessions.filter((item) => item.sectionId !== sectionId);
  state.enrollments = state.enrollments.filter((item) => item.sectionId !== sectionId);
  state.records = state.records.filter((item) => !sessionIds.includes(item.sessionId));
  state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => !sessionIds.includes(item.sessionId));
  state.attempts = Object.fromEntries(
    Object.entries(state.attempts).filter(([, attempt]) => !sessionIds.includes(attempt.sessionId))
  );
  for (const sessionId of sessionIds) {
    delete state.qrTokens[sessionId];
  }

  saveState(state);
  return clone(section);
}

export function deleteAdminSession(sessionId: string) {
  const state = getState();
  const session = state.sessions.find((item) => item.sessionId === sessionId);
  if (!session) {
    return null;
  }

  state.sessions = state.sessions.filter((item) => item.sessionId !== sessionId);
  state.records = state.records.filter((item) => item.sessionId !== sessionId);
  state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => item.sessionId !== sessionId);
  state.attempts = Object.fromEntries(
    Object.entries(state.attempts).filter(([, attempt]) => attempt.sessionId !== sessionId)
  );
  delete state.qrTokens[sessionId];

  saveState(state);
  return clone(buildAdminSessionRecord(state, session));
}

export function addAdminRoom(input: {
  roomId: string;
  roomName: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  gpsPolicy: AdminRoomRecord['gpsPolicy'];
}) {
  const state = getState();
  const room: RoomLocation = {
    roomId: input.roomId,
    roomName: input.roomName,
    latitude: input.latitude,
    longitude: input.longitude,
    defaultRadiusM: input.radiusM,
    gpsPolicy: input.gpsPolicy
  };

  state.rooms.unshift(room);
  saveState(state);
  return clone(room);
}

export function updateAdminRoom(input: {
  roomId: string;
  roomName: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  gpsPolicy: AdminRoomRecord['gpsPolicy'];
}) {
  const state = getState();
  const room = state.rooms.find((item) => item.roomId === input.roomId);
  if (!room) {
    return null;
  }

  room.roomName = input.roomName;
  room.latitude = input.latitude;
  room.longitude = input.longitude;
  room.defaultRadiusM = input.radiusM;
  room.gpsPolicy = input.gpsPolicy;

  saveState(state);
  return clone(room);
}

export function deleteAdminRoom(roomId: string) {
  const state = getState();
  const room = state.rooms.find((item) => item.roomId === roomId);
  if (!room) {
    return null;
  }

  const removedSectionIds = state.sections.filter((item) => item.roomId === roomId).map((item) => item.sectionId);
  const removedSessionIds = state.sessions.filter((item) => removedSectionIds.includes(item.sectionId)).map((item) => item.sessionId);
  state.rooms = state.rooms.filter((item) => item.roomId !== roomId);
  state.sections = state.sections.filter((item) => item.roomId !== roomId);
  state.sessions = state.sessions.filter((item) => !removedSectionIds.includes(item.sectionId));
  state.enrollments = state.enrollments.filter((item) => !removedSectionIds.includes(item.sectionId));
  state.records = state.records.filter((item) => !removedSessionIds.includes(item.sessionId));
  state.manualApprovalQueue = state.manualApprovalQueue.filter((item) => !removedSessionIds.includes(item.sessionId));
  state.attempts = Object.fromEntries(
    Object.entries(state.attempts).filter(([, attempt]) => !removedSessionIds.includes(attempt.sessionId))
  );
  for (const sessionId of removedSessionIds) {
    delete state.qrTokens[sessionId];
  }

  saveState(state);
  return clone(room);
}

export function createEnrollment(input: { studentId: string; sectionId: string }) {
  const state = getState();
  const exists = state.enrollments.find((item) => item.studentId === input.studentId && item.sectionId === input.sectionId);
  if (exists) {
    return clone(exists);
  }

  const enrollment: EnrollmentRecord = {
    enrollmentId: `enroll-${Date.now()}`,
    studentId: input.studentId,
    sectionId: input.sectionId
  };
  state.enrollments.unshift(enrollment);
  saveState(state);
  return clone(enrollment);
}

export function deleteEnrollment(enrollmentId: string) {
  const state = getState();
  const index = state.enrollments.findIndex((item) => item.enrollmentId === enrollmentId);
  if (index === -1) {
    return null;
  }

  const [removed] = state.enrollments.splice(index, 1);
  saveState(state);
  return clone(removed);
}


export function bindStudentIdentity(profileId: string, input: { studentCode: string; fullNameTh: string; lineUserId?: string }) {
  const state = getState();
  const student = state.students.find((item) => item.studentCode === input.studentCode && item.fullNameTh === input.fullNameTh);
  if (!student || student.profileId !== profileId) {
    return null;
  }

  const nextLineUserId = input.lineUserId?.trim() || student.lineUserId || `demo-${student.studentCode}`;
  student.lineUserId = nextLineUserId;
  const profile = getProfileOrThrow(state, student.profileId);
  profile.lineUserId = nextLineUserId;
  saveState(state);
  return clone(student);
}

export function appendAuditLog(input: {
  actorProfileId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const state = getState();
  const auditItem: AdminAuditLogItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: nowIso(),
    actorProfileId: input.actorProfileId ?? 'system',
    actorLabel: resolveActorLabel(input.actorProfileId),
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {}
  };

  state.auditLogs.unshift(auditItem);
  saveState(state);
  return clone(auditItem);
}

export function getTeacherOptions() {
  const state = getState();
  return clone(state.profiles.filter((item) => item.role === 'teacher'));
}

export function getSectionOptions() {
  const state = getState();
  return clone(
    state.sections.map((section) => ({
      sectionId: section.sectionId,
      label: `${section.courseCode} / ตอน ${section.sectionCode}`
    }))
  );
}

export function getRoomOptions() {
  return clone(
    getState().rooms.map((room) => ({
      roomId: room.roomId,
      label: room.roomName
    }))
  );
}

export function resetDemoState() {
  globalThis.__attendanceCheckerState = undefined;
  try {
    unlinkSync(STATE_FILE);
  } catch {}
}
