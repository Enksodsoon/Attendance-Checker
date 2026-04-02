import Link from 'next/link';
import { CheckInForm } from '@/components/student/check-in-form';
import { Card } from '@/components/ui/card';
import { demoStudentDashboard } from '@/lib/services/demo-data';

type SearchParams = {
  method?: string;
};

export default function LiffCheckInPage({ searchParams }: Readonly<{ searchParams?: SearchParams }>) {
  const session = demoStudentDashboard.activeSessions[0];
  const initialMethod = searchParams?.method === 'gps' ? 'gps' : 'qr';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <CheckInForm session={session} initialMethod={initialMethod} />

      <Card>
        <p className="text-sm text-slate-500">Success / failure / manual fallback</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/liff" className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-700">
            Success screen → กลับหน้า dashboard เมื่อตรวจสอบผ่าน
          </Link>
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            Failure screen → แสดง invalid QR / นอกเวลา / อยู่นอก geofence
          </div>
          <Link href="/liff/history" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
            Manual approval request screen → ดูประวัติ/สถานะคำร้อง
          </Link>
        </div>
      </Card>
    </main>
  );
}
