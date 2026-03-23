import { HistoryList } from '@/components/student/history-list';
import { Card } from '@/components/ui/card';
import { getStudentDashboard } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default function LiffHistoryPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <HistoryList items={getStudentDashboard().recentHistory} />
      <Card>
        <p className="text-sm text-slate-500">Profile / settings screen</p>
        <h2 className="text-2xl font-semibold text-slate-900">การตั้งค่า</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>แสดงข้อมูล LINE binding และ student profile</li>
          <li>ดูรายการเช็กชื่อและคำร้อง manual approval ล่าสุด</li>
          <li>แนวทางติดต่ออาจารย์เมื่อถูกปฏิเสธหรือรออนุมัติ</li>
        </ul>
      </Card>
    </main>
  );
}
