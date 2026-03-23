import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { UserManagementPanel } from '@/components/admin/user-management-panel';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / user management"
      title="จัดการผู้ใช้"
      description="เพิ่มผู้ใช้ใหม่และตรวจดูรายการบัญชีล่าสุดจากข้อมูลจริงของแอป ไม่ใช่ข้อความ placeholder."
    >
      <UserManagementPanel />
    </AdminSectionShell>
  );
}
