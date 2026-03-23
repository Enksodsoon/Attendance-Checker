import type {
  AdminAuditLogItem,
  AdminCourseSection,
  AdminExportItem,
  AdminRoomRecord,
  AdminUserRecord,
  AttendanceDecision,
  AttendanceHistoryItem,
  AttendanceStatus,
  StudentDashboardData,
  TeacherMonitorData,
  TeacherRosterRow
} from '@/lib/types';
import { encodeQrPayload, generateQrToken } from '@/lib/utils/qr';

const ACTIVE_SESSION_ID = 'cs401-sec1-open';
const ACTIVE_SESSION_ROUTE = `/teacher/sessions/${ACTIVE_SESSION_ID}`;
const STUDENT_PROFILE_ID = 'profile-student-650610001';
const STUDENT_ID = 'student-650610001';
const STUDENT_CODE = '650610001';

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
  student: StudentDashboardData['student'];
  activeSession: StudentDashboardData['activeSessions'][number];
  qrToken: string;
  history: AttendanceHistoryItem[];
  absentCount: number;
  roster: TeacherRosterRow[];
  adminUsers: AdminUserRecord[];
  adminCourses: AdminCourseSection[];
  adminRooms: AdminRoomRecord[];
  adminExports: AdminExportItem[];
  manualApprovalQueue: Array<{
    attemptId: string;
    sessionId: string;
    studentCode: string;
    fullNameTh: string;
    reasonText: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  auditLogs: AdminAuditLogItem[];
  attempts: Record<string, AttendanceAttemptState>;
}

declare global {
  var __attendanceCheckerAppState: AppState | undefined;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function buildActiveSession() {
  const now = new Date();
  const scheduledStart = new Date(now.getTime() - 10 * 60 * 1000);
  const attendanceOpen = new Date(now.getTime() - 30 * 60 * 1000);
  const lateAfter = new Date(now.getTime() - 5 * 60 * 1000);
  const attendanceClose = new Date(now.getTime() + 45 * 60 * 1000);
  const scheduledEnd = new Date(now.getTime() + 110 * 60 * 1000);

  return {
    sessionId: ACTIVE_SESSION_ID,
    courseCode: 'CS401',
    courseNameTh: 'วิศวกรรมซอฟต์แวร์ระดับองค์กร',
    sectionCode: '1',
    teacherName: 'รศ.ดร.ชลธิชา สุวรรณกิจ',
    status: 'open' as const,
    verificationMode: 'gps_qr_timewindow' as const,
    attendanceMode: 'check_in_only' as const,
    allowManualApproval: true,
    room: {
      roomId: 'ENG-B520',
      roomName: 'อาคารวิศวกรรม ห้อง B520',
      latitude: 13.736717,
      longitude: 100.523186,
      defaultRadiusM: 180,
      gpsPolicy: 'allow_manual_approval' as const
    },
    window: {
      scheduledStartAt: scheduledStart.toISOString(),
      scheduledEndAt: scheduledEnd.toISOString(),
      attendanceOpenAt: attendanceOpen.toISOString(),
      lateAfterAt: lateAfter.toISOString(),
      attendanceCloseAt: attendanceClose.toISOString()
    }
  };
}

function buildInitialState(): AppState {
  const activeSession = buildActiveSession();

  return {
    student: {
      profileId: STUDENT_PROFILE_ID,
      studentId: STUDENT_ID,
      studentCode: STUDENT_CODE,
      fullNameTh: 'ศิริกร วัฒนกูล',
      lineUserId: 'U5c8a2d18f1a9b23011',
      role: 'student'
    },
    activeSession,
    qrToken: 'CS401-B520-CHECKIN',
    history: [
      {
        recordId: 'record-cs330-20260321',
        sessionId: 'cs330-sec2-20260321',
        dateLabel: '21 มี.ค. 2026',
        courseLabel: 'CS330 / ตอน 2',
        status: 'present',
        checkedInAt: '2026-03-21T02:01:00.000Z'
      },
      {
        recordId: 'record-cs360-20260319',
        sessionId: 'cs360-sec1-20260319',
        dateLabel: '19 มี.ค. 2026',
        courseLabel: 'CS360 / ตอน 1',
        status: 'late',
        checkedInAt: '2026-03-19T02:14:00.000Z'
      }
    ],
    absentCount: 1,
    roster: [
      {
        studentId: 'student-650610002',
        studentCode: '650610002',
        fullNameTh: 'ปาริชาติ แก้วกัลยา',
        status: 'present',
        checkedInAt: '09:03',
        distanceM: 14,
        accuracyM: 18
      },
      {
        studentId: 'student-650610003',
        studentCode: '650610003',
        fullNameTh: 'ณัฐพงศ์ มณีรัตน์',
        status: 'late',
        checkedInAt: '09:12',
        distanceM: 21,
        accuracyM: 24
      }
    ],
    adminUsers: [
      {
        profileId: 'profile-admin-01',
        name: 'พิมพ์ชนก อนันตกุล',
        email: 'admin.registrar@university.ac.th',
        role: 'super_admin',
        status: 'active',
        lastActiveAt: nowIso()
      },
      {
        profileId: 'profile-teacher-01',
        name: activeSession.teacherName,
        email: 'cholthicha@university.ac.th',
        role: 'teacher',
        status: 'active',
        lastActiveAt: nowIso()
      },
      {
        profileId: STUDENT_PROFILE_ID,
        name: 'ศิริกร วัฒนกูล',
        email: '650610001@university.ac.th',
        role: 'student',
        status: 'active',
        lastActiveAt: nowIso()
      }
    ],
    adminCourses: [
      {
        sectionId: 'cs401-sec1-2568',
        courseCode: activeSession.courseCode,
        courseNameTh: activeSession.courseNameTh,
        sectionCode: activeSession.sectionCode,
        semesterLabel: 'ภาคการศึกษาที่ 2/2568',
        teacherName: activeSession.teacherName,
        roomName: activeSession.room.roomName,
        activeSessionId: activeSession.sessionId,
        enrolledCount: 36
      },
      {
        sectionId: 'cs305-sec2-2568',
        courseCode: 'CS305',
        courseNameTh: 'ฐานข้อมูลขั้นสูง',
        sectionCode: '2',
        semesterLabel: 'ภาคการศึกษาที่ 2/2568',
        teacherName: 'ผศ.ดร.ธนัชพร กิตติพงษ์',
        roomName: 'อาคารวิทยาศาสตร์ ห้อง S401',
        enrolledCount: 42
      }
    ],
    adminRooms: [
      {
        roomId: activeSession.room.roomId,
        roomName: activeSession.room.roomName,
        latitude: activeSession.room.latitude,
        longitude: activeSession.room.longitude,
        radiusM: activeSession.room.defaultRadiusM,
        gpsPolicy: activeSession.room.gpsPolicy,
        activeSessionId: activeSession.sessionId
      },
      {
        roomId: 'SCI-S401',
        roomName: 'อาคารวิทยาศาสตร์ ห้อง S401',
        latitude: 13.737401,
        longitude: 100.52254,
        radiusM: 150,
        gpsPolicy: 'strict'
      }
    ],
    adminExports: [
      {
        id: 'attendance-csv',
        label: 'ดาวน์โหลดรายชื่อเช็กชื่อ (CSV)',
        description: 'ส่งออกข้อมูลเช็กชื่อของคาบที่กำลังเปิดใช้งานในรูปแบบ CSV',
        href: `/api/teacher/sessions/${ACTIVE_SESSION_ID}/export`
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
        href: `/api/teacher/sessions/${ACTIVE_SESSION_ID}/monitor`
      }
    ],
    manualApprovalQueue: [],
    auditLogs: [
      {
        id: 'audit-seed-1',
        occurredAt: '2026-03-22T03:15:00.000Z',
        actorProfileId: 'profile-admin-01',
        actorLabel: 'พิมพ์ชนก อนันตกุล',
        actionType: 'room.geofence_reviewed',
        entityType: 'room',
        entityId: activeSession.room.roomId,
        metadata: {
          radiusM: activeSession.room.defaultRadiusM,
          gpsPolicy: activeSession.room.gpsPolicy
        }
      }
    ],
    attempts: {}
  };
}

function getState() {
  if (!globalThis.__attendanceCheckerAppState) {
    globalThis.__attendanceCheckerAppState = buildInitialState();
  }

  return globalThis.__attendanceCheckerAppState;
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function buildSummary(history: AttendanceHistoryItem[], absentCount: number) {
  return {
    totalPresent: history.filter((item) => item.status === 'present').length,
    totalLate: history.filter((item) => item.status === 'late').length,
    totalPending: history.filter((item) => item.status === 'pending_approval').length,
    totalAbsent: absentCount
  };
}

function buildMetrics(state: AppState) {
  const present = state.roster.filter((item) => item.status === 'present').length;
  const late = state.roster.filter((item) => item.status === 'late').length;
  const pendingApproval = state.roster.filter((item) => item.status === 'pending_approval').length;
  const enrolledCount = state.adminCourses.find((course) => course.activeSessionId === state.activeSession.sessionId)?.enrolledCount ?? state.roster.length;
  const absent = Math.max(enrolledCount - present - late - pendingApproval, 0);

  return { present, late, pendingApproval, absent };
}

function upsertHistory(sessionId: string, status: AttendanceStatus, checkedInAt?: string, note?: string) {
  const state = getState();
  const existing = state.history.find((item) => item.sessionId === sessionId);
  const courseLabel = `${state.activeSession.courseCode} / ตอน ${state.activeSession.sectionCode}`;
  const dateLabel = formatDateLabel(checkedInAt ?? nowIso());

  if (existing) {
    existing.status = status;
    existing.checkedInAt = checkedInAt;
    existing.dateLabel = dateLabel;
    existing.courseLabel = courseLabel;
    existing.note = note;
    return;
  }

  state.history.unshift({
    recordId: `record-${sessionId}`,
    sessionId,
    dateLabel,
    courseLabel,
    status,
    checkedInAt,
    note
  });
}

function upsertStudentRosterEntry(decision: AttendanceDecision, checkedInAt: string) {
  const state = getState();
  const existing = state.roster.find((row) => row.studentId === state.student.studentId);
  const row: TeacherRosterRow = {
    studentId: state.student.studentId,
    studentCode: state.student.studentCode,
    fullNameTh: state.student.fullNameTh,
    status: decision.status,
    checkedInAt: decision.verificationResult === 'accepted' ? new Date(checkedInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : undefined,
    distanceM: decision.distanceFromCenterM ? Math.round(decision.distanceFromCenterM) : undefined,
    accuracyM: decision.finalAccuracyM ? Math.round(decision.finalAccuracyM) : undefined,
    approvalStatus: decision.status === 'pending_approval' ? 'pending' : undefined
  };

  if (existing) {
    Object.assign(existing, row);
    return;
  }

  state.roster.unshift(row);
}

function resolveActorLabel(profileId?: string) {
  const state = getState();
  if (!profileId) {
    return 'system';
  }

  return state.adminUsers.find((user) => user.profileId === profileId)?.name ?? state.student.fullNameTh;
}

export function getActiveSessionId() {
  return ACTIVE_SESSION_ID;
}

export function getActiveSessionRoute() {
  return ACTIVE_SESSION_ROUTE;
}

export function getCurrentQrToken() {
  return getState().qrToken;
}

export function refreshCurrentQrToken(sessionId: string) {
  const state = getState();
  if (sessionId !== state.activeSession.sessionId) {
    return null;
  }

  state.qrToken = generateQrToken();
  return state.qrToken;
}

export function getStudentDashboard(): StudentDashboardData {
  const state = getState();
  return clone({
    student: state.student,
    activeSessions: [state.activeSession],
    summary: buildSummary(state.history, state.absentCount),
    recentHistory: state.history
  });
}

export function getTeacherMonitorData(): TeacherMonitorData {
  const state = getState();
  return clone({
    session: state.activeSession,
    qrPayload: encodeQrPayload({
      sessionId: state.activeSession.sessionId,
      token: state.qrToken
    }),
    metrics: buildMetrics(state),
    roster: state.roster
  });
}

export function getAdminUsers() {
  return clone(getState().adminUsers);
}

export function getAdminCourses() {
  return clone(getState().adminCourses);
}

export function getAdminRooms() {
  return clone(getState().adminRooms);
}

export function getAdminExports() {
  return clone(getState().adminExports);
}

export function getManualApprovalQueue() {
  return clone(getState().manualApprovalQueue);
}

export function getAuditLogs() {
  return clone(getState().auditLogs);
}

export function recordCheckInAttempt(input: {
  attemptId: string;
  decision: AttendanceDecision;
  submittedAt: string;
}) {
  const state = getState();
  state.attempts[input.attemptId] = {
    attemptId: input.attemptId,
    sessionId: state.activeSession.sessionId,
    studentId: state.student.studentId,
    studentCode: state.student.studentCode,
    fullNameTh: state.student.fullNameTh,
    decision: input.decision,
    createdAt: input.submittedAt
  };

  if (input.decision.status === 'present' || input.decision.status === 'late' || input.decision.status === 'pending_approval') {
    upsertStudentRosterEntry(input.decision, input.submittedAt);
    upsertHistory(state.activeSession.sessionId, input.decision.status, input.submittedAt);
  }
}

export function createManualApprovalRequest(input: {
  sessionId: string;
  attendanceAttemptId: string;
  reasonText: string;
}) {
  const state = getState();
  const attempt = state.attempts[input.attendanceAttemptId];

  if (!attempt || attempt.sessionId !== input.sessionId) {
    return null;
  }

  const existing = state.manualApprovalQueue.find((item) => item.attemptId === input.attendanceAttemptId);
  if (existing) {
    return clone(existing);
  }

  const queueItem = {
    attemptId: input.attendanceAttemptId,
    sessionId: input.sessionId,
    studentCode: attempt.studentCode,
    fullNameTh: attempt.fullNameTh,
    reasonText: input.reasonText,
    requestedAt: nowIso(),
    status: 'pending' as const
  };

  state.manualApprovalQueue.unshift(queueItem);
  upsertHistory(input.sessionId, 'pending_approval', attempt.createdAt, input.reasonText);

  const rosterEntry = state.roster.find((row) => row.studentId === attempt.studentId);
  if (rosterEntry) {
    rosterEntry.status = 'pending_approval';
    rosterEntry.approvalStatus = 'pending';
  }

  return clone(queueItem);
}


export function addAdminUser(input: {
  name: string;
  email: string;
  role: AdminUserRecord['role'];
}) {
  const state = getState();
  const user: AdminUserRecord = {
    profileId: `profile-${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
    status: 'active',
    lastActiveAt: nowIso()
  };

  state.adminUsers.unshift(user);
  return clone(user);
}

export function addAdminCourse(input: {
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  semesterLabel: string;
  teacherName: string;
  roomName: string;
  enrolledCount: number;
}) {
  const state = getState();
  const course: AdminCourseSection = {
    sectionId: `section-${Date.now()}`,
    courseCode: input.courseCode,
    courseNameTh: input.courseNameTh,
    sectionCode: input.sectionCode,
    semesterLabel: input.semesterLabel,
    teacherName: input.teacherName,
    roomName: input.roomName,
    enrolledCount: input.enrolledCount
  };

  state.adminCourses.unshift(course);
  return clone(course);
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
  const room: AdminRoomRecord = {
    roomId: input.roomId,
    roomName: input.roomName,
    latitude: input.latitude,
    longitude: input.longitude,
    radiusM: input.radiusM,
    gpsPolicy: input.gpsPolicy
  };

  state.adminRooms.unshift(room);
  return clone(room);
}

export function resolveManualApprovalRequest(input: {
  attemptId: string;
  status: 'approved' | 'rejected';
}) {
  const state = getState();
  const queueItem = state.manualApprovalQueue.find((item) => item.attemptId === input.attemptId);
  if (!queueItem) {
    return null;
  }

  queueItem.status = input.status;

  const rosterEntry = state.roster.find((row) => row.studentCode === queueItem.studentCode);
  if (rosterEntry) {
    rosterEntry.approvalStatus = input.status;
    rosterEntry.status = input.status === 'approved' ? 'present' : 'rejected';
  }

  const historyItem = state.history.find((item) => item.sessionId === queueItem.sessionId);
  if (historyItem) {
    historyItem.status = input.status === 'approved' ? 'present' : 'rejected';
    historyItem.note = `${queueItem.reasonText} · ผลการพิจารณา: ${input.status}`;
  }

  return clone(queueItem);
}

export function getSessionOverview() {
  const monitor = getTeacherMonitorData();
  return {
    monitor,
    manualApprovalQueue: getManualApprovalQueue(),
    qrToken: getCurrentQrToken()
  };
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
  return clone(auditItem);
}
