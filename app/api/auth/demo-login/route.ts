import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getProfile } from '@/lib/services/app-data';

const schema = z.object({ profileId: z.string().min(1) });

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const profile = getProfile(payload.profileId);
  if (!profile) {
    return NextResponse.json({ error: 'ไม่พบบัญชีทดลองที่เลือก' }, { status: 404 });
  }

  const response = NextResponse.json({ profile });
  response.cookies.set(SESSION_COOKIE, payload.profileId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });
  return response;
}
