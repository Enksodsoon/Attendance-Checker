import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / audit log viewer"
      title="ตรวจสอบ audit log"
      description="ดูบันทึกการกระทำล่าสุดพร้อม filter แบบอ่านง่ายขึ้น เพื่อไล่เหตุการณ์สำคัญในระบบได้เร็วกว่าเดิม."
    >
      <AuditLogViewer />
    </AdminSectionShell>
  );
}
