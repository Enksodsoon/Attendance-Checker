import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { getCurrentQrToken, getStudentDashboard, recordCheckInAttempt } from '@/lib/services/app-data';
import { buildAttendanceAttemptLog, validateAttendanceCheckIn } from '@/lib/services/attendance-validator';
import { writeAuditLog } from '@/lib/services/audit-log';
import { attendanceCheckInSchema } from '@/lib/validators/attendance';

export async function POST(request: Request) {
  const json = await request.json();
  const payload = attendanceCheckInSchema.parse(json);
  const env = getEnv();
  const dashboard = getStudentDashboard();
  const session = dashboard.activeSessions.find((item) => item.sessionId === payload.sessionId);

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
    identity: dashboard.student,
    session,
    enrollmentConfirmed: true,
    activeQrToken: getCurrentQrToken(),
    existingRecordStatus: undefined,
    maxAccuracyM: env.GPS_MAX_ACCURACY_M,
    defaultRadiusM: env.DEFAULT_GEOFENCE_RADIUS_M,
    manualApprovalPolicy: env.MANUAL_APPROVAL_POLICY
  };

  const decision = validateAttendanceCheckIn(context, payload);
  const attemptId = `attempt-${Date.now()}`;
  const attemptLog = buildAttendanceAttemptLog(context, payload, decision);

  recordCheckInAttempt({
    attemptId,
    decision,
    submittedAt: attemptLog.submittedAt
  });

  await writeAuditLog({
    actorProfileId: dashboard.student.profileId,
    actionType: 'attendance.check_in_submitted',
    entityType: 'class_session',
    entityId: session.sessionId,
    metadata: {
      attemptId,
      decision,
      attemptLog,
      manualReason: payload.manualReason ?? null
    }
  });

  return NextResponse.json({ decision, attemptLog, attemptId });
}
