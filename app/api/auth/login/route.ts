export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { users } from '@/db/schema';
import { generateTokens } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { loginSchema } from '@/lib/schemas/auth';
import { handleApiError } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS' 
        }, 
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS' 
        }, 
        { status: 401 }
      );
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    const { accessToken, refreshToken } = await generateTokens(user.id, userAgent, ipAddress);

    const response = NextResponse.json({ 
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    });

    (await cookies()).set('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (Keep cookie for web)
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

