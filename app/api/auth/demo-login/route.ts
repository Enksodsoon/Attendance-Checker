import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  void request;
  return NextResponse.json({ error: 'บัญชีนี้ไม่สามารถเข้าใช้งานได้ในขณะนี้' }, { status: 403 });
}
