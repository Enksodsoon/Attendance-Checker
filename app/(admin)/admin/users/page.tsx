import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { UserManagementPanel } from '@/components/admin/user-management-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / user management"
      title="จัดการผู้ใช้"
      description="เพิ่มผู้ใช้ใหม่และตรวจดูรายการบัญชีล่าสุดจากข้อมูลจริงของแอป พร้อมลบบัญชีที่ไม่ต้องใช้งานต่อได้."
    >
      <UserManagementPanel />
    </AdminSectionShell>
  );
}
