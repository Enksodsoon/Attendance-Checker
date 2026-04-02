import Link from 'next/link';
import { CalendarDays, MapPin, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { SessionSummary } from '@/lib/types';

export function ActiveSessionList({ sessions }: Readonly<{ sessions: SessionSummary[] }>) {
  return (
    <Card className="space-y-3">
      <p className="text-lg font-bold text-slate-900">รายการคลาสที่เปิดเช็กชื่อ</p>
      {sessions.map((session) => (
        <div key={session.sessionId} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-indigo-700">{session.courseCode} · {session.sectionCode}</p>
              <p className="text-lg font-bold text-slate-900">{session.courseNameTh}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {session.room.roomName}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">พร้อมเช็กชื่อ</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/liff/check-in?method=qr" className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white">
              <QrCode className="h-4 w-4" /> เช็กด้วย QR
            </Link>
            <Link href="/liff/check-in?method=gps" className="flex items-center justify-center gap-1 rounded-xl border border-rose-300 px-3 py-3 text-sm font-semibold text-rose-600">
              <CalendarDays className="h-4 w-4" /> เช็กด้วย GPS
            </Link>
          </div>
        </div>
      ))}
    </Card>
  );
}
