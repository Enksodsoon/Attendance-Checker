import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyLineIdentity } from '@/lib/auth/line';
import { getSessionProfile } from '@/lib/auth/session';
import { linkVerifiedLineToExistingProfile } from '@/lib/services/db/accounts';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  accessToken: z.string().min(10).optional(),
  idToken: z.string().min(10).optional(),
  displayName: z.string().min(1).optional(),
  pictureUrl: z.string().url().optional(),
  statusMessage: z.string().optional()
});

function mapLinkError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('line_already_linked')) {
    return { status: 409, error: 'LINE account is already linked to another profile.' };
  }
  if (message.includes('profile_already_linked')) {
    return { status: 409, error: 'This profile is already linked to another LINE account.' };
  }
  return { status: 500, error: 'Unable to link LINE account.' };
}

export async function POST(request: Request) {
  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LINE verification failed' },
      { status: 401 }
    );
  }

  try {
    const linked = await linkVerifiedLineToExistingProfile({
      profileId: session.profileId,
      lineUserId: identity.lineUserId,
      displayName: identity.displayName,
      pictureUrl: identity.pictureUrl
    });

    return NextResponse.json({
      status: 'ok',
      lineAccount: linked
    });
  } catch (error) {
    const mapped = mapLinkError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
