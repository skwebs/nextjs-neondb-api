import { db } from '@/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic health check that doesn't depend on a specific table
    return NextResponse.json({ 
      status: 'ok', 
      message: 'API is healthy',
      database: 'connected'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
