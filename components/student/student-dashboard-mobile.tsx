import type { Route } from 'next';
import Link from 'next/link';
import type { AttendanceHistoryItem, SessionSummary, StudentAttendanceSummary, StudentIdentity } from '@/lib/types';

const weekdayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as const;

const statusStyleMap = {
  present: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  late: 'border-sky-300 bg-sky-100 text-sky-700',
  pending_approval: 'border-amber-300 bg-amber-100 text-amber-700',
  absent: 'border-rose-300 bg-rose-100 text-rose-700',
  rejected: 'border-rose-300 bg-rose-100 text-rose-700',
  excused: 'border-violet-300 bg-violet-100 text-violet-700'
} as const;

function buildCalendarDates(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = firstDay.getDay();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < leading; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function keyForDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function StudentDashboardMobile({
  student,
  summary,
  activeSessions,
  recentHistory
}: Readonly<{
  student: StudentIdentity;
  summary: StudentAttendanceSummary;
  activeSessions: SessionSummary[];
  recentHistory: AttendanceHistoryItem[];
}>) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const activeSession = activeSessions[0];
  const calendarCells = buildCalendarDates(now);

  const statusByDate = recentHistory.reduce<Record<string, AttendanceHistoryItem['status']>>((acc, item) => {
    if (item.checkedInAt) {
      acc[item.checkedInAt.slice(0, 10)] = item.status;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">TokBut Student Attendance</p>
            <h1 className="text-3xl font-bold text-indigo-600">{student.fullNameTh}</h1>
            <p className="text-sm text-slate-500">รหัส {student.studentCode}</p>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">พร้อมใช้งาน</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Link href={'/liff/check-in' as Route} className="rounded-2xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white">
            เช็กชื่อเข้าเรียน
          </Link>
          <Link href={'/liff/history' as Route} className="rounded-2xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700">
            ประวัติ
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-600">{monthLabel}</h2>
          <span className="rounded-xl border border-indigo-200 px-3 py-1 text-sm font-semibold text-indigo-700">วันนี้</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-indigo-700">
          {weekdayLabels.map((dayLabel) => (
            <div key={dayLabel}>{dayLabel}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="h-11 rounded-xl bg-slate-50" />;
            }

            const dateKey = keyForDate(cell);
            const status = statusByDate[dateKey];
            const isToday = dateKey === keyForDate(now);

            return (
              <div
                key={dateKey}
                className={`flex h-11 items-center justify-center rounded-xl border text-base ${
                  status ? statusStyleMap[status] : 'border-slate-300 bg-white text-slate-600'
                } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
              >
                {cell.getDate()}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-sky-100 p-3 text-center">
          <p className="text-xs text-slate-500">มาเรียน</p>
          <p className="text-xl font-bold text-sky-700">{summary.totalPresent}</p>
        </div>
        <div className="rounded-2xl bg-amber-100 p-3 text-center">
          <p className="text-xs text-slate-500">สาย</p>
          <p className="text-xl font-bold text-amber-700">{summary.totalLate}</p>
        </div>
        <div className="rounded-2xl bg-violet-100 p-3 text-center">
          <p className="text-xs text-slate-500">รออนุมัติ</p>
          <p className="text-xl font-bold text-violet-700">{summary.totalPending}</p>
        </div>
        <div className="rounded-2xl bg-rose-100 p-3 text-center">
          <p className="text-xs text-slate-500">ขาด/ปฏิเสธ</p>
          <p className="text-xl font-bold text-rose-700">{summary.totalAbsent}</p>
        </div>
      </section>

      {activeSession ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">คาบเรียนที่เปิดอยู่</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{activeSession.courseCode} · {activeSession.courseNameTh}</p>
          <p className="text-sm text-slate-500">ตอน {activeSession.sectionCode} · {activeSession.room.roomName}</p>
          <p className="mt-2 text-sm text-emerald-700">
            เปิดเช็กชื่อถึง {new Date(activeSession.window.attendanceCloseAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </section>
      ) : null}
    </div>
  );
}
