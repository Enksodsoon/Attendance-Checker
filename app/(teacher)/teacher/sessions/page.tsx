import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { getActiveSessionRoute, getTeacherMonitorData } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default function TeacherSessionListPage() {
  const monitor = getTeacherMonitorData();
  const sessionRoute = getActiveSessionRoute() as Route;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Teacher home / session list</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">คาบเรียนวันนี้</h1>
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">{monitor.session.courseCode} · {monitor.session.courseNameTh}</p>
          <p className="mt-1 text-sm text-slate-500">เปิดเช็กชื่ออยู่ที่ {monitor.session.room.roomName}</p>
          <p className="mt-2 text-sm text-slate-600">present {monitor.metrics.present} · late {monitor.metrics.late} · pending {monitor.metrics.pendingApproval}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={sessionRoute} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>
              เปิด live monitor
            </Link>
            <Link href={'/admin/sessions' as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700">
              เปิด manual approval queue
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
