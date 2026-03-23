import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getEnv } from '@/lib/config/env';
import { getCurrentQrToken, getExistingRecordStatus, getSessionById, isStudentEnrolled, recordCheckInAttempt } from '@/lib/services/app-data';
import { buildAttendanceAttemptLog, validateAttendanceCheckIn } from '@/lib/services/attendance-validator';
import { writeAuditLog } from '@/lib/services/audit-log';
import { attendanceCheckInSchema } from '@/lib/validators/attendance';

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || actor.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const payload = attendanceCheckInSchema.parse(json);
  const env = getEnv();
  const session = getSessionById(payload.sessionId);

  if (!session) {
    return NextResponse.json(
      {
        error: 'ไม่พบคาบเรียนที่ต้องการเช็กชื่อ',
        decision: {
          status: 'rejected',
          verificationResult: 'rejected',
          reasonCode: 'session_not_open',
          requiresManualApproval: false
        }
      },
      { status: 404 }
    );
  }

  const context = {
    identity: {
      profileId: actor.profileId,
      studentId: actor.studentId ?? '',
      studentCode: actor.email.split('@')[0] ?? '',
      fullNameTh: actor.name,
      lineUserId: actor.lineUserId ?? '',
      role: 'student' as const
    },
    session,
    enrollmentConfirmed: isStudentEnrolled(actor.profileId, payload.sessionId),
    activeQrToken: getCurrentQrToken(payload.sessionId) ?? '',
    existingRecordStatus: getExistingRecordStatus(actor.profileId, payload.sessionId),
    maxAccuracyM: env.GPS_MAX_ACCURACY_M,
    defaultRadiusM: env.DEFAULT_GEOFENCE_RADIUS_M,
    manualApprovalPolicy: env.MANUAL_APPROVAL_POLICY
  };

  const decision = validateAttendanceCheckIn(context, payload);
  const attemptId = `attempt-${Date.now()}`;
  const attemptLog = buildAttendanceAttemptLog(context, payload, decision);

  recordCheckInAttempt({
    profileId: actor.profileId,
    sessionId: payload.sessionId,
    attemptId,
    decision,
    submittedAt: attemptLog.submittedAt
  });

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'attendance.check_in_submitted',
    entityType: 'class_session',
    entityId: payload.sessionId,
    metadata: {
      attemptId,
      decision,
      attemptLog,
      manualReason: payload.manualReason ?? null
    }
  });

  return NextResponse.json({ decision, attemptLog, attemptId });
}
