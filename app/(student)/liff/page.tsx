import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { ActiveSessionList } from '@/components/student/active-session-list';
import { AttendanceCalendar } from '@/components/student/attendance-calendar';
import { LiffBootstrap } from '@/components/student/liff-bootstrap';
import { Card } from '@/components/ui/card';
import { demoStudentDashboard } from '@/lib/services/demo-data';

export default function LiffHomePage() {
  const { student, activeSessions, recentHistory } = demoStudentDashboard;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-4 py-5">
      <LiffBootstrap />
      <AttendanceCalendar history={recentHistory} />
      <ActiveSessionList sessions={activeSessions} />

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">นักศึกษา</p>
          <p className="font-semibold text-slate-900">{student.fullNameTh}</p>
        </div>
        <Link href="/liff/history" className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700">
          <UserRound className="h-4 w-4" /> ประวัติการเช็กชื่อ
        </Link>
      </Card>
    </main>
  );
}
