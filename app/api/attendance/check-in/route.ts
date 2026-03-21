import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { buildAttendanceAttemptLog, validateAttendanceCheckIn } from '@/lib/services/attendance-validator';
import { writeAuditLog } from '@/lib/services/audit-log';
import { demoStudentDashboard } from '@/lib/services/demo-data';
import { attendanceCheckInSchema } from '@/lib/validators/attendance';

export async function POST(request: Request) {
  const json = await request.json();
  const payload = attendanceCheckInSchema.parse(json);
  const env = getEnv();
  const session = demoStudentDashboard.activeSessions.find((item) => item.sessionId === payload.sessionId);

  if (!session) {
    return NextResponse.json(
      {
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

  const decision = validateAttendanceCheckIn(
    {
      identity: demoStudentDashboard.student,
      session,
      enrollmentConfirmed: true,
      activeQrToken: 'demo-token-20260321',
      existingRecordStatus: undefined,
      maxAccuracyM: env.GPS_MAX_ACCURACY_M,
      defaultRadiusM: env.DEFAULT_GEOFENCE_RADIUS_M,
      manualApprovalPolicy: env.MANUAL_APPROVAL_POLICY,
      nowIso: '2026-03-21T02:06:00.000Z'
    },
    payload
  );

  const attemptLog = buildAttendanceAttemptLog(
    {
      identity: demoStudentDashboard.student,
      session,
      enrollmentConfirmed: true,
      activeQrToken: 'demo-token-20260321',
      existingRecordStatus: undefined,
      maxAccuracyM: env.GPS_MAX_ACCURACY_M,
      defaultRadiusM: env.DEFAULT_GEOFENCE_RADIUS_M,
      manualApprovalPolicy: env.MANUAL_APPROVAL_POLICY,
      nowIso: '2026-03-21T02:06:00.000Z'
    },
    payload,
    decision
  );

  await writeAuditLog({
    actorProfileId: demoStudentDashboard.student.profileId,
    actionType: 'attendance.check_in_submitted',
    entityType: 'class_session',
    entityId: session.sessionId,
    metadata: {
      decision,
      attemptLog,
      manualReason: payload.manualReason ?? null
    }
  });

  return NextResponse.json({ decision, attemptLog });
}
