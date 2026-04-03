import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120),
  lineUserId: z.string().min(5)
});

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || actor.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const admin = createSupabaseAdminClient();

  const { data: student } = await admin
    .from('students')
    .select('id, profile_id, student_code, profiles!inner(full_name_th)')
    .eq('profile_id', actor.profileId)
    .eq('student_code', payload.studentCode)
    .maybeSingle();

  const profileRow = Array.isArray(student?.profiles) ? student?.profiles[0] : student?.profiles;
  if (!student || !profileRow || profileRow.full_name_th !== payload.fullNameTh) {
    return NextResponse.json({ error: 'ไม่พบรหัสนักศึกษาที่ตรงกับบัญชีปัจจุบัน' }, { status: 404 });
  }

  const { error } = await admin.from('line_accounts').upsert({
    profile_id: actor.profileId,
    line_user_id: payload.lineUserId,
    display_name: payload.fullNameTh,
    is_verified: true,
    last_login_at: new Date().toISOString()
  }, { onConflict: 'profile_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'line_account.bound',
    entityType: 'profile',
    entityId: actor.profileId,
    metadata: payload
  });

  return NextResponse.json({
    status: 'success',
    profileId: actor.profileId,
    lineUserId: payload.lineUserId,
    studentCode: payload.studentCode,
    fullNameTh: payload.fullNameTh
  });
}
