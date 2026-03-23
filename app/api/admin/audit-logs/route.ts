import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/services/app-data';

export async function GET() {
  return NextResponse.json({
    items: getAuditLogs()
  });
}
