import { notFound } from 'next/navigation';
import { SessionMonitor } from '@/components/teacher/session-monitor';
import { demoTeacherMonitor } from '@/lib/services/demo-data';
import { generateQrDataUrl, parseQrPayload } from '@/lib/utils/qr';

export default async function TeacherSessionMonitorPage({ params }: Readonly<{ params: Promise<{ sessionId: string }> }>) {
  const { sessionId } = await params;

  if (sessionId !== demoTeacherMonitor.session.sessionId) {
    notFound();
  }

  const payload = parseQrPayload(demoTeacherMonitor.qrPayload);
  if (!payload) {
    throw new Error('Invalid demo QR payload');
  }

  const qrDataUrl = await generateQrDataUrl(payload);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6">
      <SessionMonitor data={demoTeacherMonitor} qrDataUrl={qrDataUrl} />
    </main>
  );
}
