import { LiffBootstrap } from '@/components/student/liff-bootstrap';
import { StudentDashboardMobile } from '@/components/student/student-dashboard-mobile';
import { requireSessionProfile } from '@/lib/auth/session';
import { getStudentDashboard } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default async function LiffHomePage() {
  const profile = await requireSessionProfile(['student']);
  const { student, activeSessions, summary, recentHistory } = getStudentDashboard(profile.profileId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 py-4">
      <StudentDashboardMobile student={student} summary={summary} activeSessions={activeSessions} recentHistory={recentHistory} />
      <LiffBootstrap student={student} />
    </main>
  );
}
