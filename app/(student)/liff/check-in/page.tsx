import { redirect } from 'next/navigation';
import { CheckInForm } from '@/components/student/check-in-form';
import { requireSessionProfile } from '@/lib/auth/session';
import { getCurrentQrToken, getSessionById, getStudentSessions } from '@/lib/services/db/student-attendance';

export const dynamic = 'force-dynamic';

export default async function LiffCheckInPage({ searchParams }: Readonly<{ searchParams: Promise<{ sessionId?: string }> }>) {
  const profile = await requireSessionProfile(['student']);
  const params = await searchParams;
  const sessions = await getStudentSessions(profile.profileId);
  const chosenSessionId = params.sessionId ?? sessions[0]?.sessionId;

  if (!chosenSessionId) {
    redirect('/liff');
  }

  const session = await getSessionById(chosenSessionId);
  if (!session) {
    redirect('/liff');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 py-4">
      <CheckInForm sessions={sessions} session={session} initialQrToken={(await getCurrentQrToken(session.sessionId)) ?? ''} />
    </main>
  );
}
