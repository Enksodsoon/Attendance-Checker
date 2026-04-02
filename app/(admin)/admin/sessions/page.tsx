import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { SessionOversightPanel } from '@/components/admin/session-oversight-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
  await requireSessionProfile(['admin', 'super_admin']);
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
