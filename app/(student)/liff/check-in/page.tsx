import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckInForm } from '@/components/student/check-in-form';
import { Card } from '@/components/ui/card';
import { requireSessionProfile } from '@/lib/auth/session';
import { getCurrentQrToken, getSessionById, getStudentSessionOptions } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default async function LiffCheckInPage({ searchParams }: Readonly<{ searchParams: Promise<{ sessionId?: string }> }>) {
  const profile = await requireSessionProfile(['student']);
  const params = await searchParams;
  const sessions = getStudentSessionOptions(profile.profileId);
  const chosenSessionId = params.sessionId ?? sessions[0]?.sessionId;

  if (!chosenSessionId) {
    redirect('/liff');
  }

  const session = getSessionById(chosenSessionId);
  if (!session) {
    redirect('/liff');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <CheckInForm sessions={sessions} session={session} initialQrToken={getCurrentQrToken(session.sessionId) ?? ''} />

      <Card>
        <p className="text-sm text-slate-500">Success / failure / manual fallback</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={'/liff' as Route} className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-700">
            Success screen → กลับหน้า dashboard เพื่อดูสถิติที่อัปเดตแล้ว
          </Link>
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            Failure screen → แสดง invalid QR / นอกเวลา / อยู่นอก geofence ชัดเจนจากผลตรวจจริง
          </div>
          <Link href={'/liff/history' as Route} className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
            Manual approval request screen → ดูสถานะคำร้องที่เพิ่งส่งได้จาก history
          </Link>
        </div>
      </Card>
    </main>
  );
}
