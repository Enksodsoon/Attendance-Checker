import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { CourseManagementPanel } from '@/components/admin/course-management-panel';

export const dynamic = 'force-dynamic';

export default function AdminCoursesPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / course-section management"
      title="จัดการรายวิชาและตอนเรียน"
      description="เพิ่มรายวิชา/ตอนเรียนใหม่และตรวจดูรายการปัจจุบันจาก state กลางของระบบ."
    >
      <CourseManagementPanel />
    </AdminSectionShell>
  );
}
