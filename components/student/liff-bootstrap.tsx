import type { StudentIdentity } from '@/lib/types';

export function LiffBootstrap({ student }: Readonly<{ student: StudentIdentity }>) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">สถานะการเชื่อมต่อ LIFF</p>
      <div className="mt-2 space-y-1 text-slate-600">
        <p>ชื่อ: {student.fullNameTh}</p>
        <p>รหัสนักศึกษา: {student.studentCode}</p>
        <p>LINE User ID: {student.lineUserId || 'ยังไม่ได้ bind'}</p>
      </div>
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">เชื่อมต่อบัญชี LINE แล้ว สามารถเช็กชื่อด้วย QR หรือ GPS ได้ทันที</p>
    </section>
  );
}
