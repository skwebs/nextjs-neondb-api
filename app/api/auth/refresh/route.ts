import { NextResponse } from 'next/server';
import { rotateTokens } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    const tokens = await rotateTokens(refreshToken, userAgent, ipAddress);

    if (!tokens) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Update cookie for web compatibility
    (await cookies()).set('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json(tokens);
  } catch (error) {
    return handleApiError(error);
  }
}
