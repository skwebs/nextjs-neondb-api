export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { creditCards } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { cardSchema } from '@/lib/schemas/cards';
import { handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userId, userId));

    return NextResponse.json({ cards });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validatedData = cardSchema.parse(body);

    const [newCard] = await db
      .insert(creditCards)
      .values({
        ...validatedData,
        userId,
      })
      .returning();

    return NextResponse.json({ card: newCard });
  } catch (error) {
    return handleApiError(error);
  }
}

