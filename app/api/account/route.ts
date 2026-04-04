import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { getAccountByProfileId, updateOwnAccount } from '@/lib/services/db/accounts';

const patchSchema = z.object({
  fullNameTh: z.string().min(2).max(120).optional(),
  email: z.string().email().optional().or(z.literal('')),
  academicYear: z.coerce.number().int().min(1).max(8).optional(),
  facultyName: z.string().max(120).optional()
});

export async function GET() {
  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await getAccountByProfileId(session.profileId);
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json({ account });
}

export async function PATCH(request: Request) {
  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  if (raw && typeof raw === 'object') {
    const blockedKeys = ['lineUserId', 'role', 'profileId'];
    if (blockedKeys.some((key) => key in (raw as Record<string, unknown>))) {
      return NextResponse.json({ error: 'Cannot modify protected account fields' }, { status: 400 });
    }
  }
  const parsed = patchSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const allowed = {
    fullNameTh: payload.fullNameTh,
    email: payload.email,
    academicYear: session.role === 'student' ? payload.academicYear : undefined,
    facultyName: session.role === 'student' ? payload.facultyName : undefined
  };

  try {
    const account = await updateOwnAccount(session.profileId, session.role, allowed);
    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update account' },
      { status: 409 }
    );
  }
}
