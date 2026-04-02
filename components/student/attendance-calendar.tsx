import { Card } from '@/components/ui/card';
import type { AttendanceHistoryItem } from '@/lib/types';

const weekHeaders = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function AttendanceCalendar({ history }: Readonly<{ history: AttendanceHistoryItem[] }>) {
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const statusByDay = new Map<number, 'present' | 'late' | 'pending_approval'>();
  for (const item of history) {
    if (!item.checkedInAt) continue;
    const date = new Date(item.checkedInAt);
    if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) continue;
    if (item.status === 'present' || item.status === 'late' || item.status === 'pending_approval') {
      statusByDay.set(date.getDate(), item.status);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-indigo-700">{currentMonthLabel}</p>
        <button className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">วันนี้</button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {weekHeaders.map((label) => (
          <p key={label} className="font-semibold text-slate-500">{label}</p>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const state = statusByDay.get(day);
          const tone =
            state === 'present'
              ? 'border-sky-400 bg-sky-100 text-sky-900'
              : state === 'late'
                ? 'border-amber-400 bg-amber-100 text-amber-900'
                : state === 'pending_approval'
                  ? 'border-violet-400 bg-violet-100 text-violet-900'
                  : 'border-slate-300 bg-white text-slate-600';

          return (
            <div key={day} className={`rounded-xl border py-2 ${tone}`}>
              {day}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
