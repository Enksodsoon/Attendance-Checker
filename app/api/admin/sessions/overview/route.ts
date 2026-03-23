import { NextResponse } from 'next/server';
import { getSessionOverview } from '@/lib/services/app-data';

export async function GET() {
  return NextResponse.json(getSessionOverview());
}
