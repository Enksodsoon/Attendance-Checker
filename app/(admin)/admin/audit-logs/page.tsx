import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / audit log viewer"
      title="ตรวจสอบ audit log"
      description="หน้านี้ดึงข้อมูลจาก API ของผู้ดูแลระบบโดยตรง เพื่อยืนยันว่าหน้าบ้านแสดงผลจาก endpoint ที่ใช้งานได้จริง ไม่ใช่ข้อความ placeholder."
    >
      <AuditLogViewer />
    </AdminSectionShell>
  );
}
