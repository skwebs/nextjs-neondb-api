import { db } from '@/db';
import { creditCards } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateCardSchema = z.object({
  name: z.string().min(1).optional(),
  last4Digits: z.string().length(4).regex(/^\d+$/).optional(),
  statementDay: z.number().min(1).max(31).optional(),
  dueDayOffset: z.number().min(1).max(60).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateCardSchema.parse(body);

    const [updatedCard] = await db
      .update(creditCards)
      .set(validatedData)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!updatedCard) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ card: updatedCard });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [deletedCard] = await db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!deletedCard) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
