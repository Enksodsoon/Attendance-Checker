import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LINE_ID_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';

async function clearSessionCookies() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(LINE_ID_COOKIE);
}

export async function GET(request: Request) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL('/login', request.url));
}

export async function POST(request: Request) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL('/login', request.url));
}
