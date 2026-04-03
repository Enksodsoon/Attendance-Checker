import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { resolveLineAccount } from '@/lib/services/db/student-attendance';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  lineUserId: z.string().min(5)
});

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const account = await resolveLineAccount(parsed.data.lineUserId);
  if (!account) {
    return NextResponse.json({ error: 'LINE account is not linked to student profile' }, { status: 404 });
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId: account.profileId, role: account.role }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  return NextResponse.json({ status: 'ok', profileId: account.profileId, role: account.role });
}
