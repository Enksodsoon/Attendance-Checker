import { getEnv } from '@/lib/config/env';
import type {
  AttendanceAttemptLogInput,
  AttendanceDecision,
  AttendanceValidationContext,
  CheckInPayload,
  SessionSummary
} from '@/lib/types';
import { calculateDistanceMeters } from '@/lib/utils/distance';


function hasGpsCoordinates(payload: CheckInPayload): payload is CheckInPayload & { latitude: number; longitude: number } {
  return payload.latitude !== undefined && payload.longitude !== undefined;
}

export function resolveCheckInMethod(payload: CheckInPayload): 'qr' | 'gps' | 'hybrid' | 'none' {
  const hasQr = Boolean(payload.qrToken?.trim());
  const hasGps = hasGpsCoordinates(payload);

  if (hasQr && hasGps) {
    return 'hybrid';
  }
  if (hasQr) {
    return 'qr';
  }
  if (hasGps) {
    return 'gps';
  }

  return 'none';
}

function isWithinWindow(session: SessionSummary, now: Date) {
  return now >= new Date(session.window.attendanceOpenAt) && now <= new Date(session.window.attendanceCloseAt);
}

function isLate(session: SessionSummary, now: Date) {
  return now > new Date(session.window.lateAfterAt);
}

function getTimeWindowFailureReason(session: SessionSummary, now: Date): AttendanceDecision['reasonCode'] {
  if (now < new Date(session.window.attendanceOpenAt)) {
    return 'outside_time_window';
  }

  if (now > new Date(session.window.attendanceCloseAt)) {
    return 'outside_time_window';
  }

  return 'session_not_open';
}

function buildDecision(partial: Omit<AttendanceDecision, 'finalAccuracyM'> & { finalAccuracyM?: number }): AttendanceDecision {
  return {
    status: partial.status,
    verificationResult: partial.verificationResult,
    reasonCode: partial.reasonCode,
    distanceFromCenterM: partial.distanceFromCenterM,
    finalAccuracyM: partial.finalAccuracyM,
    requiresManualApproval: partial.requiresManualApproval
  };
}

export function validateAttendanceCheckIn(context: AttendanceValidationContext, payload: CheckInPayload): AttendanceDecision {
  const env = getEnv();
  const now = context.nowIso ? new Date(context.nowIso) : new Date();

  if (context.session.status !== 'open' || !isWithinWindow(context.session, now)) {
    return buildDecision({
      status: 'rejected',
      verificationResult: 'rejected',
      reasonCode: getTimeWindowFailureReason(context.session, now),
      requiresManualApproval: false
    });
  }

  if (!context.enrollmentConfirmed) {
    return buildDecision({
      status: 'rejected',
      verificationResult: 'rejected',
      reasonCode: 'not_enrolled',
      requiresManualApproval: false
    });
  }

  if (context.existingRecordStatus === 'present' || context.existingRecordStatus === 'late') {
    return buildDecision({
      status: context.existingRecordStatus,
      verificationResult: 'rejected',
      reasonCode: 'duplicate_check_in',
      requiresManualApproval: false
    });
  }

  const method = resolveCheckInMethod(payload);

  if (method === 'none') {
    return buildDecision({
      status: 'pending_approval',
      verificationResult: 'pending_approval',
      reasonCode: 'gps_missing',
      requiresManualApproval: context.session.allowManualApproval
    });
  }

  if ((method === 'qr' || method === 'hybrid') && context.activeQrToken !== payload.qrToken) {
    return buildDecision({
      status: 'rejected',
      verificationResult: 'rejected',
      reasonCode: 'invalid_qr',
      requiresManualApproval: false
    });
  }

  if (method === 'qr') {
    return buildDecision({
      status: isLate(context.session, now) ? 'late' : 'present',
      verificationResult: 'accepted',
      reasonCode: isLate(context.session, now) ? 'ok_late' : 'ok_present',
      requiresManualApproval: false
    });
  }

  if (!hasGpsCoordinates(payload)) {
    return buildDecision({
      status: 'pending_approval',
      verificationResult: 'pending_approval',
      reasonCode: 'gps_missing',
      requiresManualApproval: context.session.allowManualApproval
    });
  }

  const distanceFromCenterM = calculateDistanceMeters(
    {
      latitude: context.session.room.latitude,
      longitude: context.session.room.longitude
    },
    {
      latitude: payload.latitude,
      longitude: payload.longitude
    }
  );

  const finalAccuracyM = payload.gpsAccuracyM;
  const maxAccuracy = context.maxAccuracyM || env.GPS_MAX_ACCURACY_M;
  const allowedRadius = context.session.room.defaultRadiusM || context.defaultRadiusM;

  if (finalAccuracyM === undefined || Number.isNaN(finalAccuracyM)) {
    return buildDecision({
      status: 'pending_approval',
      verificationResult: 'pending_approval',
      reasonCode: 'gps_missing',
      distanceFromCenterM,
      requiresManualApproval: true
    });
  }

  if (finalAccuracyM > maxAccuracy) {
    const shouldPend = context.manualApprovalPolicy === 'pending_if_accuracy_poor' && context.session.allowManualApproval;
    return buildDecision({
      status: shouldPend ? 'pending_approval' : 'rejected',
      verificationResult: shouldPend ? 'pending_approval' : 'rejected',
      reasonCode: 'gps_accuracy_poor',
      distanceFromCenterM,
      finalAccuracyM,
      requiresManualApproval: shouldPend
    });
  }

  if (distanceFromCenterM > allowedRadius) {
    return buildDecision({
      status: 'rejected',
      verificationResult: 'rejected',
      reasonCode: 'outside_geofence',
      distanceFromCenterM,
      finalAccuracyM,
      requiresManualApproval: false
    });
  }

  return buildDecision({
    status: isLate(context.session, now) ? 'late' : 'present',
    verificationResult: 'accepted',
    reasonCode: isLate(context.session, now) ? 'ok_late' : 'ok_present',
    distanceFromCenterM,
    finalAccuracyM,
    requiresManualApproval: false
  });
}

export function buildAttendanceAttemptLog(
  context: AttendanceValidationContext,
  payload: CheckInPayload,
  decision: AttendanceDecision
): AttendanceAttemptLogInput {
  return {
    classSessionId: context.session.sessionId,
    studentId: context.identity.studentId,
    submittedAt: context.nowIso ?? new Date().toISOString(),
    latitude: payload.latitude,
    longitude: payload.longitude,
    gpsAccuracyM: payload.gpsAccuracyM,
    distanceFromCenterM: decision.distanceFromCenterM,
    qrTokenSubmitted: payload.qrToken,
    verificationResult: decision.verificationResult,
    failureReason: decision.reasonCode,
    deviceUserAgent: payload.deviceUserAgent,
    source: 'liff'
  };
}
