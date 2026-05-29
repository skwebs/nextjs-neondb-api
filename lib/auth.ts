import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

export interface SessionPayload {
  userId: string;
}

export async function signJWT(payload: SessionPayload, expiresIn: string = '1h') {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function generateTokens(userId: string, userAgent?: string, ipAddress?: string) {
  // 1. Generate Access Token (Short-lived)
  const accessToken = await signJWT({ userId }, '1h');

  // 2. Generate Refresh Token (Long-lived, random string)
  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // 3. Save Refresh Token to DB
  await db.insert(sessions).values({
    userId,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function rotateTokens(oldRefreshToken: string, userAgent?: string, ipAddress?: string) {
  // 1. Find session in DB
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, oldRefreshToken))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
    }
    return null;
  }

  // 2. Delete old session
  await db.delete(sessions).where(eq(sessions.id, session.id));

  // 3. Generate new pair
  return await generateTokens(session.userId, userAgent, ipAddress);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch (_err) {
    return null;
  }
}

export function getToken(req: Request | NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookies
  if ('cookies' in req && typeof req.cookies.get === 'function') {
    return (req as NextRequest).cookies.get('token')?.value || null;
  }

  return null;
}

export async function getSession(req?: Request | NextRequest) {
  let token: string | null = null;
  
  if (req) {
    token = getToken(req);
  } else {
    // Fallback for Server Actions / RSC where req might not be passed
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value || null;
  }

  if (!token) return null;
  return await verifyJWT(token);
}
