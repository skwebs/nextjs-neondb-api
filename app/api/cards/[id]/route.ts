export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { creditCards } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { updateCardSchema } from '@/lib/schemas/cards';
import { handleApiError } from '@/lib/api-utils';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateCardSchema.parse(body);

    const [updatedCard] = await db
      .update(creditCards)
      .set(validatedData)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!updatedCard) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Card not found or unauthorized',
          code: 'NOT_FOUND' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const [deletedCard] = await db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!deletedCard) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Card not found or unauthorized',
          code: 'NOT_FOUND' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

