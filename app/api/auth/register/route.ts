export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { registerSchema } from '@/lib/schemas/auth';
import { handleApiError } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning({ id: users.id, email: users.email });

    return NextResponse.json({ 
      message: 'User registered successfully',
      user: newUser 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

