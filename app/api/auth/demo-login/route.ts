import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  return NextResponse.json({ error: 'บัญชีนี้ไม่สามารถเข้าใช้งานได้ในขณะนี้' }, { status: 403 });
}
