import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      {
        actor_profile_id: 'profile-admin-1',
        action_type: 'attendance.override',
        entity_type: 'attendance_record',
        entity_id: 'record-1',
        metadata: {
          old_status: 'late',
          new_status: 'excused'
        }
      }
    ]
  });
}
