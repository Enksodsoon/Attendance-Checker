import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { AttendanceHistoryItem } from '@/lib/types';

const toneMap = {
  present: 'teal',
  late: 'amber',
  absent: 'red',
  pending_approval: 'amber',
  excused: 'slate',
  rejected: 'red'
} as const;

export function HistoryList({ items }: Readonly<{ items: AttendanceHistoryItem[] }>) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">History screen</p>
          <h2 className="text-2xl font-semibold text-slate-900">ประวัติการเช็กชื่อ</h2>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.recordId} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{item.courseLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{item.dateLabel}</p>
              </div>
              <Badge tone={toneMap[item.status]}>{item.status}</Badge>
            </div>
            {item.checkedInAt ? <p className="mt-3 text-sm text-slate-600">เวลาเช็กชื่อ: {new Date(item.checkedInAt).toLocaleString('th-TH')}</p> : null}
            {item.note ? <p className="mt-2 text-sm text-slate-600">หมายเหตุ: {item.note}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
