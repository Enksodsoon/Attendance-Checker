import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { StudentManagementPanel } from '@/components/admin/student-management-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / student registry"
      title="ทะเบียนนักศึกษา"
      description="เพิ่มนักศึกษาใหม่ ตรวจสอบการ bind LINE และดูตอนเรียนที่นักศึกษาแต่ละคนลงทะเบียนอยู่."
    >
      <StudentManagementPanel />
    </AdminSectionShell>
  );
}
