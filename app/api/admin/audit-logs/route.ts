import { NextResponse } from 'next/server';
import { demoAdminAuditLogs } from '@/lib/services/demo-admin';

export async function GET() {
  return NextResponse.json({
    items: demoAdminAuditLogs
  });
}
