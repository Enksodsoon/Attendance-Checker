export type AppRole = 'student' | 'teacher' | 'admin' | 'super_admin';
export type ProfileStatus = 'active' | 'inactive' | 'suspended';
export type SessionStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'pending_approval' | 'excused' | 'rejected';
export type VerificationMode = 'gps_qr_timewindow';
export type AttendanceMode = 'check_in_only';
export type GpsPolicy = 'strict' | 'allow_manual_approval';
export type ManualApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface UserProfile {
  profileId: string;
  name: string;
  email: string;
  role: AppRole;
  status: ProfileStatus;
  lastActiveAt: string;
  studentId?: string;
  teacherId?: string;
  lineUserId?: string;
}

export interface StudentIdentity {
  profileId: string;
  studentId: string;
  studentCode: string;
  fullNameTh: string;
  lineUserId: string;
  role: 'student';
}

export interface StudentRecord {
  studentId: string;
  profileId: string;
  studentCode: string;
  fullNameTh: string;
  facultyName: string;
  departmentName: string;
  yearLevel: number;
  status: ProfileStatus;
  lineUserId?: string;
}

export interface TeacherRecord {
  teacherId: string;
  profileId: string;
  fullNameTh: string;
}

export interface RoomLocation {
  roomId: string;
  roomName: string;
  latitude: number;
  longitude: number;
  defaultRadiusM: number;
  gpsPolicy: GpsPolicy;
}

export interface SessionWindow {
  scheduledStartAt: string;
  scheduledEndAt: string;
  attendanceOpenAt: string;
  lateAfterAt: string;
  attendanceCloseAt: string;
}

export interface SessionSummary {
  sessionId: string;
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  teacherName: string;
  room: RoomLocation;
  status: SessionStatus;
  verificationMode: VerificationMode;
  attendanceMode: AttendanceMode;
  allowManualApproval: boolean;
  window: SessionWindow;
}

export interface StudentAttendanceSummary {
  totalPresent: number;
  totalLate: number;
  totalPending: number;
  totalAbsent: number;
}

export interface AttendanceHistoryItem {
  recordId: string;
  sessionId: string;
  dateLabel: string;
  courseLabel: string;
  status: AttendanceStatus;
  checkedInAt?: string;
  note?: string;
}

export interface StudentDashboardData {
  student: StudentIdentity;
  activeSessions: SessionSummary[];
  summary: StudentAttendanceSummary;
  recentHistory: AttendanceHistoryItem[];
}

export interface CheckInPayload {
  sessionId: string;
  qrToken: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracyM?: number;
  deviceUserAgent?: string;
  manualReason?: string;
}

export interface AttendanceDecision {
  status: AttendanceStatus;
  verificationResult: 'accepted' | 'pending_approval' | 'rejected';
  reasonCode:
    | 'ok_present'
    | 'ok_late'
    | 'session_not_open'
    | 'not_enrolled'
    | 'outside_time_window'
    | 'duplicate_check_in'
    | 'invalid_qr'
    | 'gps_missing'
    | 'gps_accuracy_poor'
    | 'outside_geofence';
  distanceFromCenterM?: number;
  finalAccuracyM?: number;
  requiresManualApproval: boolean;
}

export interface AttendanceValidationContext {
  identity: StudentIdentity;
  session: SessionSummary;
  enrollmentConfirmed: boolean;
  existingRecordStatus?: AttendanceStatus;
  activeQrToken: string;
  nowIso?: string;
  maxAccuracyM: number;
  defaultRadiusM: number;
  manualApprovalPolicy: 'pending_if_accuracy_poor' | 'reject_if_accuracy_poor';
}

export interface AttendanceAttemptLogInput {
  classSessionId: string;
  studentId: string;
  submittedAt: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracyM?: number;
  distanceFromCenterM?: number;
  qrTokenSubmitted: string;
  verificationResult: AttendanceDecision['verificationResult'];
  failureReason: AttendanceDecision['reasonCode'];
  deviceUserAgent?: string;
  source: 'liff';
}

export interface TeacherRosterRow {
  studentId: string;
  studentCode: string;
  fullNameTh: string;
  status: AttendanceStatus;
  checkedInAt?: string;
  distanceM?: number;
  accuracyM?: number;
  approvalStatus?: ManualApprovalStatus;
}

export interface TeacherMonitorData {
  session: SessionSummary;
  qrPayload: string;
  metrics: {
    present: number;
    late: number;
    pendingApproval: number;
    absent: number;
  };
  roster: TeacherRosterRow[];
}

export interface TeacherSessionListItem extends SessionSummary {
  metrics: TeacherMonitorData['metrics'];
}

export interface AuditLogInput {
  actorProfileId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface AdminUserRecord {
  profileId: string;
  name: string;
  email: string;
  role: AppRole;
  status: ProfileStatus;
  lastActiveAt: string;
  linkedStudentCode?: string;
}

export interface AdminCourseSection {
  sectionId: string;
  courseCode: string;
  courseNameTh: string;
  sectionCode: string;
  semesterLabel: string;
  teacherName: string;
  roomName: string;
  activeSessionId?: string;
  enrolledCount: number;
}

export interface AdminRoomRecord {
  roomId: string;
  roomName: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  gpsPolicy: GpsPolicy;
  activeSessionId?: string;
}

export interface AdminStudentRecord {
  studentId: string;
  profileId: string;
  studentCode: string;
  fullNameTh: string;
  facultyName: string;
  departmentName: string;
  yearLevel: number;
  status: ProfileStatus;
  lineUserId?: string;
  enrolledSectionIds: string[];
}

export interface EnrollmentRecord {
  enrollmentId: string;
  studentId: string;
  sectionId: string;
}

export interface ManualApprovalQueueItem {
  attemptId: string;
  sessionId: string;
  studentCode: string;
  fullNameTh: string;
  reasonText: string;
  requestedAt: string;
  status: ManualApprovalStatus;
}

export interface AdminAuditLogItem {
  id: string;
  occurredAt: string;
  actorProfileId: string;
  actorLabel: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AdminExportItem {
  id: string;
  label: string;
  description: string;
  href: string;
}

export interface DemoAccount {
  profileId: string;
  name: string;
  role: AppRole;
  email: string;
  description: string;
}
