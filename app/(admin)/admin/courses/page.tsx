import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { CourseManagementPanel } from '@/components/admin/course-management-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / course-section management"
      title="จัดการรายวิชาและตอนเรียน"
      description="เพิ่มรายวิชา/ตอนเรียนใหม่ กำหนดผู้สอน ห้อง และสร้าง session เบื้องต้นจาก state กลางของระบบ."
    >
      <CourseManagementPanel />
    </AdminSectionShell>
  );
}
