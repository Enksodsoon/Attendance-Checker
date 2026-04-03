import { describe, expect, it } from 'vitest';
import { resolveCheckInMethod, resolveSubmittedQrToken, validateAttendanceCheckIn } from '@/lib/services/attendance-validator';
import type { AttendanceValidationContext, CheckInPayload, SessionSummary, StudentIdentity } from '@/lib/types';

const baseSession: SessionSummary = {
  sessionId: 'session-1',
  courseCode: 'CS101',
  courseNameTh: 'ทดสอบระบบเช็กชื่อ',
  sectionCode: 'A',
  teacherName: 'Ajarn Demo',
  room: {
    roomId: 'room-1',
    roomName: 'SCB 101',
    latitude: 13.736717,
    longitude: 100.523186,
    defaultRadiusM: 150,
    gpsPolicy: 'strict'
  },
  status: 'open',
  verificationMode: 'gps_qr_timewindow',
  attendanceMode: 'check_in_only',
  allowManualApproval: true,
  window: {
    scheduledStartAt: '2026-04-02T09:00:00.000Z',
    scheduledEndAt: '2026-04-02T12:00:00.000Z',
    attendanceOpenAt: '2026-04-02T08:45:00.000Z',
    lateAfterAt: '2026-04-02T09:15:00.000Z',
    attendanceCloseAt: '2026-04-02T10:00:00.000Z'
  }
};

const identity: StudentIdentity = {
  profileId: 'profile-student-1',
  studentId: 'student-1',
  studentCode: '650610001',
  fullNameTh: 'นักศึกษาทดสอบ',
  lineUserId: 'line-user-1',
  role: 'student'
};

function buildContext(overrides?: Partial<AttendanceValidationContext>): AttendanceValidationContext {
  return {
    identity,
    session: baseSession,
    enrollmentConfirmed: true,
    activeQrToken: 'QR-DEMO-TOKEN',
    existingRecordStatus: undefined,
    maxAccuracyM: 50,
    defaultRadiusM: 200,
    manualApprovalPolicy: 'pending_if_accuracy_poor',
    nowIso: '2026-04-02T09:00:00.000Z',
    ...overrides
  };
}

describe('resolveCheckInMethod', () => {
  it('detects qr / gps / hybrid / none correctly', () => {
    expect(resolveCheckInMethod({ sessionId: 's1', qrToken: 'abc' })).toBe('qr');
    expect(resolveCheckInMethod({ sessionId: 's1', qrToken: '', latitude: 1, longitude: 2 })).toBe('gps');
    expect(resolveCheckInMethod({ sessionId: 's1', qrToken: 'abc', latitude: 1, longitude: 2 })).toBe('hybrid');
    expect(resolveCheckInMethod({ sessionId: 's1', qrToken: '' })).toBe('none');
  });
});



describe('resolveSubmittedQrToken', () => {
  it('extracts token from JSON payloads and URLs', () => {
    expect(resolveSubmittedQrToken('{"sessionId":"s1","token":"json-token"}')).toBe('json-token');
    expect(resolveSubmittedQrToken('https://example.com/check-in?token=url-token')).toBe('url-token');
    expect(resolveSubmittedQrToken('  raw-token  ')).toBe('raw-token');
  });
});

describe('validateAttendanceCheckIn', () => {
  it('accepts QR-only check-in when token is valid', () => {
    const payload: CheckInPayload = { sessionId: 'session-1', qrToken: 'QR-DEMO-TOKEN' };
    const decision = validateAttendanceCheckIn(buildContext(), payload);

    expect(decision.verificationResult).toBe('accepted');
    expect(decision.reasonCode).toBe('ok_present');
  });


  it('accepts QR payload JSON from scanner value', () => {
    const payload: CheckInPayload = {
      sessionId: 'session-1',
      qrToken: JSON.stringify({ sessionId: 'session-1', token: 'QR-DEMO-TOKEN' })
    };

    const decision = validateAttendanceCheckIn(buildContext(), payload);
    expect(decision.verificationResult).toBe('accepted');
    expect(decision.reasonCode).toBe('ok_present');
  });

  it('accepts GPS-only check-in when within geofence and accuracy threshold', () => {
    const payload: CheckInPayload = {
      sessionId: 'session-1',
      qrToken: '',
      latitude: 13.736717,
      longitude: 100.523186,
      gpsAccuracyM: 10
    };

    const decision = validateAttendanceCheckIn(buildContext(), payload);
    expect(decision.verificationResult).toBe('accepted');
    expect(decision.reasonCode).toBe('ok_present');
  });
});
