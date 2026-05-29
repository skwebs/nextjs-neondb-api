export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';

import { headers } from 'next/headers';

export async function GET() {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'UNAUTHORIZED' 
        }, 
        { status: 401 }
      );
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found',
          code: 'USER_NOT_FOUND' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

