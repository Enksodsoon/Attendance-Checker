import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

export async function POST(request: Request) {
  const expectedSecret = process.env.OFFLINE_ADMIN_LOGIN_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Offline admin login is disabled' }, { status: 403 });
  }

  const form = await request.formData();
  const secret = String(form.get('secret') ?? '');
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId: 'offline-super-admin', role: 'super_admin' }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  return NextResponse.redirect(new URL('/admin?offline=1', request.url));
}
