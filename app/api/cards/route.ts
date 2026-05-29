export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { creditCards } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const cardSchema = z.object({
  name: z.string().min(1),
  last4Digits: z.string().length(4).regex(/^\d+$/),
  statementDay: z.number().min(1).max(31),
  dueDayOffset: z.number().min(1).max(60),
});

export async function GET() {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cards = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userId, userId));

    return NextResponse.json({ cards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

