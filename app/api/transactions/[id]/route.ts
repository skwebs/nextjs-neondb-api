export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { transactions, billingCycles } from '@/db/schema';
import { getOrCreateCycle } from '@/lib/billing-cycles';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { updateTransactionSchema } from '@/lib/schemas/transactions';
import { handleApiError } from '@/lib/api-utils';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await headers()).get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    // 1. Get existing transaction
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Check if current cycle is locked
    if (existing.billingCycleId) {
      const [cycle] = await db
        .select()
        .from(billingCycles)
        .where(eq(billingCycles.id, existing.billingCycleId))
        .limit(1);

      if (cycle && cycle.status !== 'running') {
        return NextResponse.json({ 
          error: `Cannot update transaction in a ${cycle.status} billing cycle.` 
        }, { status: 403 });
      }
    }

    // 3. If settlementDate or transactionDatetime is changing, recalculate cycle
    let billingCycleId = existing.billingCycleId;
    let settlementDate = existing.settlementDate;
    let transactionDatetime = existing.transactionDatetime;

    if (validatedData.transactionDatetime) {
      transactionDatetime = new Date(validatedData.transactionDatetime);
    }

    if (validatedData.settlementDate !== undefined) {
      settlementDate = validatedData.settlementDate ? new Date(validatedData.settlementDate) : transactionDatetime;
    } else if (validatedData.transactionDatetime && !existing.settlementDate) {
      // If only transactionDatetime changed and settlementDate was null, update it to match
      settlementDate = transactionDatetime;
    }

    if (validatedData.settlementDate !== undefined || (validatedData.transactionDatetime && !existing.settlementDate)) {
       const newCycle = await getOrCreateCycle(existing.cardId, settlementDate!);
       if (newCycle.status !== 'running') {
         return NextResponse.json({ 
           error: `Cannot move transaction to a ${newCycle.status} billing cycle.` 
         }, { status: 403 });
       }
       billingCycleId = newCycle.id;
    }

    const [updated] = await db
      .update(transactions)
      .set({
        description: validatedData.description,
        amount: validatedData.amount,
        transactionDatetime,
        settlementDate,
        billingCycleId,
      })
      .where(eq(transactions.id, id))
      .returning();

    return NextResponse.json({ transaction: updated });
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // 1. Get existing to check cycle lock
    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (existing.billingCycleId) {
      const [cycle] = await db
        .select()
        .from(billingCycles)
        .where(eq(billingCycles.id, existing.billingCycleId))
        .limit(1);

      if (cycle && cycle.status !== 'running') {
        return NextResponse.json({ 
          error: `Cannot delete transaction from a ${cycle.status} billing cycle.` 
        }, { status: 403 });
      }
    }

    await db
      .delete(transactions)
      .where(eq(transactions.id, id));

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

