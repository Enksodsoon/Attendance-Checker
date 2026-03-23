import type { Route } from 'next';
import Link from 'next/link';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAdminRooms } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

const gpsTone = {
  strict: 'red',
  allow_manual_approval: 'amber'
} as const;

export default function AdminRoomsPage() {
  const rooms = getAdminRooms();

  return (
    <AdminSectionShell
      eyebrow="Admin / room-geofence management"
      title="จัดการห้องเรียนและ geofence"
      description="ตรวจสอบพิกัดรัศมีของห้องเรียนที่ใช้กับ attendance engine และเปิดไปยังคาบเรียนที่กำลังใช้ geofence ได้โดยตรง."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => (
          <Card key={room.roomId}>
            <p className="text-sm text-slate-500">{room.roomId}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{room.roomName}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Latitude: {room.latitude}</p>
              <p>Longitude: {room.longitude}</p>
              <p>Geofence radius: {room.radiusM} เมตร</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge tone={gpsTone[room.gpsPolicy]}>{room.gpsPolicy}</Badge>
              {room.activeSessionId ? (
                <Link href={'/admin/sessions' as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  ดูคาบที่ใช้งานห้องนี้
                </Link>
              ) : (
                <span className="text-sm text-slate-500">ยังไม่มีคาบที่เปิดใช้งาน</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AdminSectionShell>
  );
}
