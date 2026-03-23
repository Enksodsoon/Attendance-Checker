import { notFound } from 'next/navigation';
import { SessionMonitor } from '@/components/teacher/session-monitor';
import { requireSessionProfile } from '@/lib/auth/session';
import { getTeacherMonitorData } from '@/lib/services/app-data';
import { generateQrDataUrl, parseQrPayload } from '@/lib/utils/qr';

export const dynamic = 'force-dynamic';

export default async function TeacherSessionMonitorPage({ params }: Readonly<{ params: Promise<{ sessionId: string }> }>) {
  await requireSessionProfile(['teacher', 'admin', 'super_admin']);
  const { sessionId } = await params;
  const monitor = getTeacherMonitorData(sessionId);

  if (!monitor) {
    notFound();
  }

  const payload = parseQrPayload(monitor.qrPayload);
  if (!payload) {
    throw new Error('Invalid QR payload');
  }

  const qrDataUrl = await generateQrDataUrl(payload);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6">
      <SessionMonitor data={monitor} qrDataUrl={qrDataUrl} />
    </main>
  );
}
