import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getProfile } from '@/lib/services/app-data';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({ profileId: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const profile = getProfile(payload.profileId);
  if (!profile) {
    return NextResponse.json({ error: 'ไม่พบบัญชีทดลองที่เลือก' }, { status: 404 });
  }
  if (profile.status !== 'active') {
    return NextResponse.json({ error: 'บัญชีนี้ไม่สามารถเข้าใช้งานได้ในขณะนี้' }, { status: 403 });
  }

  const response = NextResponse.json({ profile });
  response.cookies.set(SESSION_COOKIE, payload.profileId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });
  return response;
}
