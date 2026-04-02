import type { StudentIdentity } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LiffBootstrap({ student }: Readonly<{ student: StudentIdentity }>) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">LIFF / student identity</p>
          <h2 className="text-2xl font-semibold text-slate-900">พร้อมใช้งานในบทบาทนักศึกษา</h2>
        </div>
        <Badge tone={student.lineUserId ? 'teal' : 'amber'}>{student.lineUserId ? 'LINE bound' : 'ต้อง bind LINE'}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        หน้านี้จำลอง session นักศึกษาที่ผูกกับบัญชีในระบบแล้ว จึงสามารถดึงคาบเรียนตามการลงทะเบียนจริงของบัญชีที่เลือกไว้ได้ทันที.
      </p>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>ชื่อ: {student.fullNameTh}</p>
        <p>รหัสนักศึกษา: {student.studentCode}</p>
        <p>LINE User ID: {student.lineUserId || 'ยังไม่ได้ bind'}</p>
      </div>
    </Card>
  );
}
