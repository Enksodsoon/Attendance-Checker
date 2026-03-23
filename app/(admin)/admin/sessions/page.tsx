import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { SessionOversightPanel } from '@/components/admin/session-oversight-panel';

export const dynamic = 'force-dynamic';

export default function AdminSessionsPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / session oversight"
      title="กำกับดูแลคาบเรียน"
      description="ติดตามสถิติคาบเรียนปัจจุบัน รีเฟรช QR token และอนุมัติ/ปฏิเสธ manual approval ได้จากหน้านี้โดยตรง."
    >
      <SessionOversightPanel />
    </AdminSectionShell>
  );
}
