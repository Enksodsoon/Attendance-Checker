import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  canManageManualApprovalRequest,
  createManualApprovalRequest,
  isTeacherAssignedToSession,
  recordCheckInAttempt,
  resetDemoState
} from '@/lib/services/app-data';
import type { AttendanceDecision } from '@/lib/types';

const pendingDecision: AttendanceDecision = {
  status: 'pending_approval',
  verificationResult: 'pending_approval',
  reasonCode: 'outside_geofence',
  requiresManualApproval: true,
  distanceFromCenterM: 250,
  finalAccuracyM: 25
};

describe('app-data authorization helpers', () => {
  beforeEach(() => {
    resetDemoState();
  });

  afterEach(() => {
    resetDemoState();
  });

  it('only marks the assigned teacher as able to manage a session', () => {
    expect(isTeacherAssignedToSession('profile-teacher-01', 'cs401-sec1-open')).toBe(true);
    expect(isTeacherAssignedToSession('profile-teacher-02', 'cs401-sec1-open')).toBe(false);
  });

  it('prevents students from creating manual-approval requests for another student attempt', () => {
    recordCheckInAttempt({
      profileId: 'profile-student-650610001',
      sessionId: 'cs401-sec1-open',
      attemptId: 'attempt-owned-by-student-1',
      decision: pendingDecision,
      submittedAt: new Date().toISOString()
    });

    expect(
      createManualApprovalRequest({
        profileId: 'profile-student-650610002',
        sessionId: 'cs401-sec1-open',
        attendanceAttemptId: 'attempt-owned-by-student-1',
        reasonText: 'ขออุทธรณ์การเช็กชื่อรายการนี้เพราะ GPS เพี้ยน'
      })
    ).toBeNull();

    expect(
      createManualApprovalRequest({
        profileId: 'profile-student-650610001',
        sessionId: 'cs401-sec1-open',
        attendanceAttemptId: 'attempt-owned-by-student-1',
        reasonText: 'ขออุทธรณ์การเช็กชื่อรายการนี้เพราะ GPS เพี้ยน'
      })
    ).toMatchObject({
      attemptId: 'attempt-owned-by-student-1',
      status: 'pending'
    });
  });

  it('only allows the owning teacher to manage a manual-approval attempt', () => {
    recordCheckInAttempt({
      profileId: 'profile-student-650610001',
      sessionId: 'cs401-sec1-open',
      attemptId: 'attempt-for-teacher-ownership-check',
      decision: pendingDecision,
      submittedAt: new Date().toISOString()
    });

    expect(canManageManualApprovalRequest('profile-teacher-01', 'attempt-for-teacher-ownership-check')).toBe(true);
    expect(canManageManualApprovalRequest('profile-teacher-02', 'attempt-for-teacher-ownership-check')).toBe(false);
  });
});
