import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LINE_ID_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';
import { isSecureCookieRequired } from '@/lib/auth/dev-auth';
import { verifyLineIdentity } from '@/lib/auth/line';
import { findAnyLineLinkByUserId, findProfileByLineUserId, updateLineAccountLoginMetadata } from '@/lib/services/db/accounts';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  displayName: z.string().min(1).optional(),
  pictureUrl: z.string().url().optional(),
  statusMessage: z.string().optional(),
  accessToken: z.string().min(10).optional(),
  idToken: z.string().min(10).optional()
});

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
      claimedDisplayName: parsed.data.displayName,
      claimedPictureUrl: parsed.data.pictureUrl,
      claimedStatusMessage: parsed.data.statusMessage
    });
  } catch (error) {
    console.error('[liff/session] LINE verification failed', error);
    return NextResponse.json(
      {
        status: 'verification_failed',
        error: error instanceof Error ? error.message : 'LINE verification failed'
      },
      { status: 401 }
    );
  }

  const account = await findProfileByLineUserId(identity.lineUserId);

  if (!account?.profileId || !account.role) {
    const existingLink = await findAnyLineLinkByUserId(identity.lineUserId);
    if (existingLink && (existingLink.status !== 'active' || existingLink.role !== 'student')) {
      return NextResponse.json({
        status: 'contact_admin',
        error: 'This LINE account is not linked for student self-claim. Please contact an administrator.'
      });
    }

    return NextResponse.json({
      status: 'registration_required',
      identity: {
        lineUserId: identity.lineUserId,
        displayName: identity.displayName,
        pictureUrl: identity.pictureUrl,
        statusMessage: identity.statusMessage
      }
    });
  }

  await updateLineAccountLoginMetadata({
    lineUserId: identity.lineUserId,
    displayName: identity.displayName,
    pictureUrl: identity.pictureUrl
  });

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId: account.profileId, role: account.role }),
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

  return NextResponse.json({ status: 'ok', profileId: account.profileId, role: account.role });
}
