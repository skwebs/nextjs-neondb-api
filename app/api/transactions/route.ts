export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { getOrCreateCycle } from '@/lib/billing-cycles';
import { and, eq, desc, inArray, gte, lte } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
// import { z } from 'zod';

import { transactionSchema } from '@/lib/schemas/transactions';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');
    const cardIds = searchParams.get('cardIds')?.split(',');
    const billingCycleId = searchParams.get('billingCycleId');
    const month = searchParams.get('month');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    // const week = searchParams.get('week');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const periodType = searchParams.get('periodType') || 'transaction'; // 'transaction' or 'settlement'
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const dateColumn = periodType === 'settlement' ? transactions.settlementDate : transactions.transactionDatetime;

    const conditions = [eq(transactions.userId, userId)];

    if (cardId) conditions.push(eq(transactions.cardId, cardId));
    if (cardIds && cardIds.length > 0) conditions.push(inArray(transactions.cardId, cardIds));
    if (billingCycleId) conditions.push(eq(transactions.billingCycleId, billingCycleId));

    if (startDate) conditions.push(gte(dateColumn, new Date(startDate)));
    if (endDate) conditions.push(lte(dateColumn, new Date(endDate)));

    if (month && !startDate && !endDate) {
      const m = parseInt(month) - 1;
      const start = new Date(parseInt(year), m, 1);
      const end = new Date(parseInt(year), m + 1, 0, 23, 59, 59, 999);
      conditions.push(and(gte(dateColumn, start), lte(dateColumn, end))!);
    }

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDatetime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ 
      transactions: results,
      page,
      limit
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const validatedData = transactionSchema.parse(body);

    const transactionDate = new Date(validatedData.transactionDatetime);
    const settlementDate = validatedData.settlementDate 
      ? new Date(validatedData.settlementDate) 
      : transactionDate;

    // 1. Get or create billing cycle
    const cycle = await getOrCreateCycle(validatedData.cardId, settlementDate);

    // 2. Check if cycle is locked (not running)
    if (cycle.status !== 'running') {
      return NextResponse.json({ 
        success: false,
        message: `Cannot add transaction to a ${cycle.status} billing cycle.`,
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 3. Insert transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId,
        cardId: validatedData.cardId,
        billingCycleId: cycle.id,
        description: validatedData.description,
        amount: validatedData.amount,
        transactionDatetime: transactionDate,
        settlementDate: settlementDate,
      })
      .returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    return handleApiError(error);
  }
}

