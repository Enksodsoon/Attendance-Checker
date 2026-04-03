import { HistoryList } from '@/components/student/history-list';
import { requireSessionProfile } from '@/lib/auth/session';
import { getStudentDashboard } from '@/lib/services/db/student-attendance';

export const dynamic = 'force-dynamic';

export default async function LiffHistoryPage() {
  const profile = await requireSessionProfile(['student']);
  const dashboard = await getStudentDashboard(profile.profileId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-3 py-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">โปรไฟล์นักศึกษา</p>
        <h1 className="text-3xl font-bold text-indigo-700">{dashboard.student.fullNameTh}</h1>
        <p className="mt-2 text-sm text-slate-600">รหัสนักศึกษา {dashboard.student.studentCode}</p>
        <p className="mt-1 text-sm text-slate-600">LINE User ID: {dashboard.student.lineUserId || 'ยังไม่ได้ bind'}</p>
      </section>
      <HistoryList items={dashboard.recentHistory} />
    </main>
  );
}
