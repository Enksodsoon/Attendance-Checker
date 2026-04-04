import { LiffBootstrap } from '@/components/student/liff-bootstrap';
import { StudentDashboardMobile } from '@/components/student/student-dashboard-mobile';
import { getSessionProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getEnv } from '@/lib/config/env';
import { getStudentDashboard } from '@/lib/services/db/student-attendance';

export const dynamic = 'force-dynamic';

export default async function LiffHomePage() {
  const env = getEnv();
  const profile = await getSessionProfile();


  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    redirect('/admin');
  }

  if (profile?.role === 'teacher') {
    redirect('/teacher/sessions');
  }

  if (!profile || profile.role !== 'student') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 py-4">
        <LiffBootstrap liffId={env.NEXT_PUBLIC_LIFF_ID} />
      </main>
    );
  }

  const { student, activeSessions, summary, recentHistory } = await getStudentDashboard(profile.profileId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 py-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/account" className="rounded-full border border-slate-300 px-3 py-1.5 text-slate-700">My account</a>
        <a href="/api/auth/logout" className="rounded-full border border-rose-300 px-3 py-1.5 text-rose-700">Logout</a>
      </div>
      <StudentDashboardMobile student={student} summary={summary} activeSessions={activeSessions} recentHistory={recentHistory} />
      <LiffBootstrap student={student} liffId={env.NEXT_PUBLIC_LIFF_ID} />
    </main>
  );
}
