import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { EnrollmentManagementPanel } from '@/components/admin/enrollment-management-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / enrollment management"
      title="จัดการการลงทะเบียนเรียน"
      description="ผูกนักศึกษากับตอนเรียนเพื่อให้ student และ teacher flow ใช้ roster จริงร่วมกัน."
    >
      <EnrollmentManagementPanel />
    </AdminSectionShell>
  );
}
