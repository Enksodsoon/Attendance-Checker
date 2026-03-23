import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { RoomManagementPanel } from '@/components/admin/room-management-panel';

export const dynamic = 'force-dynamic';

export default function AdminRoomsPage() {
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
