import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;

    if (refreshToken) {
      await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
    }

    const cookieStore = await cookies();
    cookieStore.delete('token');
    
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
