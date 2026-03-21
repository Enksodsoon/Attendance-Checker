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

export interface StudentIdentity {
  profileId: string;
  studentId: string;
  studentCode: string;
  fullNameTh: string;
  lineUserId: string;
  role: 'student';
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

export interface AuditLogInput {
  actorProfileId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}
