import { Card } from '@/components/ui/card';

export default function LiffBindPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">First-time binding</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">ผูก LINE กับรหัสนักศึกษา</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          ใน production หน้านี้จะตรวจ student_code + ข้อมูลยืนยันตัวตน แล้วสร้าง mapping ในตาราง line_accounts โดยเก็บ line_user_id แบบ unique.
        </p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            รหัสนักศึกษา
            <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="6512345678" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            ชื่อ-นามสกุล
            <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="สมชาย ใจดี" />
          </label>
          <button type="button" className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            ยืนยันการผูกบัญชี
          </button>
        </form>
      </Card>
    </main>
  );
}
