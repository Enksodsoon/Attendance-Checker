import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { RoomManagementPanel } from '@/components/admin/room-management-panel';
import { requireSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminRoomsPage() {
  await requireSessionProfile(['admin', 'super_admin']);
  return (
    <AdminSectionShell
      eyebrow="Admin / room-geofence management"
      title="จัดการห้องเรียนและ geofence"
      description="เพิ่มห้องเรียนใหม่ กำหนดพิกัด/radius/gps policy และดูรายการล่าสุดได้ทันที."
    >
      <RoomManagementPanel />
    </AdminSectionShell>
  );
}
