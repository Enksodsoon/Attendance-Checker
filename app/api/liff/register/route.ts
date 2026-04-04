import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LINE_ID_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';
import { isSecureCookieRequired } from '@/lib/auth/dev-auth';
import { verifyLineIdentity } from '@/lib/auth/line';
import { createStudentFromLineRegistration } from '@/lib/services/db/accounts';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  fullNameTh: z.string().min(2).max(120).optional(),
  studentCode: z.string().min(3).max(40),
  email: z.string().email().optional().or(z.literal('')),
  academicYear: z.coerce.number().int().min(1).max(8).optional(),
  facultyName: z.string().max(120).optional(),
  lineUserId: z.string().min(5).optional(),
  displayName: z.string().min(1).optional(),
  pictureUrl: z.string().url().optional(),
  statusMessage: z.string().optional(),
  accessToken: z.string().min(10).optional(),
  idToken: z.string().min(10).optional()
});

function mapRegistrationError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Registration failed';
  const friendly = message.toLowerCase();
  const dbCode = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : '';

  if (friendly.includes('line_already_linked') || friendly.includes('already linked') || (dbCode === '23505' && friendly.includes('line_accounts'))) {
    return { status: 409, error: 'LINE account is already linked. Please sign in with your existing account.' };
  }

  if (friendly.includes('student_code') || friendly.includes('students_student_code_key')) {
    return { status: 409, error: 'Student code is already used. Please check and try again.' };
  }

  if (friendly.includes('profiles_email_key')) {
    return { status: 409, error: 'This email is already used by another account.' };
  }

  if (friendly.includes('default organization')) {
    return { status: 500, error: 'System setup is incomplete. Please contact admin to prepare default organization.' };
  }

  return { status: 500, error: 'Registration failed unexpectedly. Please try again.' };
}

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  let identity;
  try {
    identity = await verifyLineIdentity({
      accessToken: parsed.data.accessToken,
      idToken: parsed.data.idToken,
      claimedLineUserId: parsed.data.lineUserId,
      claimedDisplayName: parsed.data.displayName,
      claimedPictureUrl: parsed.data.pictureUrl,
      claimedStatusMessage: parsed.data.statusMessage
    });
  } catch (error) {
    console.error('[liff/register] LINE verification failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LINE verification failed. Please sign in again.' },
      { status: 401 }
    );
  }

  const fullNameTh = parsed.data.fullNameTh?.trim() || identity.displayName;

  try {
    const created = await createStudentFromLineRegistration({
      lineUserId: identity.lineUserId,
      displayName: identity.displayName,
      pictureUrl: identity.pictureUrl,
      fullNameTh,
      studentCode: parsed.data.studentCode.trim(),
      email: parsed.data.email?.trim() || undefined,
      academicYear: parsed.data.academicYear,
      facultyName: parsed.data.facultyName?.trim() || undefined
    });

    const store = await cookies();
    store.set(
      SESSION_COOKIE,
      JSON.stringify({ profileId: created.profileId, role: created.role }),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecureCookieRequired(),
        path: '/',
        maxAge: 60 * 60 * 8
      }
    );

    store.set(
      LINE_ID_COOKIE,
      identity.lineUserId,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecureCookieRequired(),
        path: '/',
        maxAge: 60 * 60 * 8
      }
    );

    return NextResponse.json({ status: 'ok', profileId: created.profileId, role: created.role });
  } catch (error) {
    console.error('[liff/register] Registration failed', error);
    const mapped = mapRegistrationError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
