import { HistoryList } from '@/components/student/history-list';
import { Card } from '@/components/ui/card';
import { requireSessionProfile } from '@/lib/auth/session';
import { getStudentDashboard } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default async function LiffHistoryPage() {
  const profile = await requireSessionProfile(['student']);
  const dashboard = getStudentDashboard(profile.profileId);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <HistoryList items={dashboard.recentHistory} />
      <Card>
        <p className="text-sm text-slate-500">Profile / settings screen</p>
        <h2 className="text-2xl font-semibold text-slate-900">โปรไฟล์นักศึกษา</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>รหัสนักศึกษา: {dashboard.student.studentCode}</li>
          <li>LINE user id ที่ bind แล้ว: {dashboard.student.lineUserId || 'ยังไม่ได้ bind'}</li>
          <li>ดูรายการเช็กชื่อและคำร้อง manual approval ล่าสุด</li>
          <li>ติดต่ออาจารย์ได้ทันทีเมื่อรายการถูกปฏิเสธหรือรออนุมัติ</li>
        </ul>
      </Card>
    </main>
  );
}
