import { db } from '@/db';
import { billingCycles, creditCards } from '@/db/schema';
import { and, eq, lte, gte } from 'drizzle-orm';
import { addDays, setDate, subMonths, addMonths, startOfDay, endOfDay } from 'date-fns';

/**
 * Calculates the billing cycle boundaries for a given date.
 * Statement day is the last day of the cycle.
 */
export function getCycleBoundaries(date: Date, statementDay: number, dueDayOffset: number) {
  let endDate = setDate(date, statementDay);
  
  // If the current date is after the statement day, the cycle ends next month
  if (date > endDate) {
    endDate = addMonths(endDate, 1);
  }

  const startDate = addDays(subMonths(endDate, 1), 1);
  const dueDate = addDays(endDate, dueDayOffset);

  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
    dueDate: endOfDay(dueDate),
  };
}

export async function getOrCreateCycle(cardId: string, date: Date) {
  // 1. Get card details
  const [card] = await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.id, cardId))
    .limit(1);

  if (!card) throw new Error('Card not found');

  const { startDate, endDate, dueDate } = getCycleBoundaries(
    date,
    card.statementDay,
    card.dueDayOffset
  );

  // 2. Check if cycle already exists
  const [existingCycle] = await db
    .select()
    .from(billingCycles)
    .where(
      and(
        eq(billingCycles.cardId, cardId),
        eq(billingCycles.startDate, startDate),
        eq(billingCycles.endDate, endDate)
      )
    )
    .limit(1);

  if (existingCycle) return existingCycle;

  // 3. Create new cycle
  const [newCycle] = await db
    .insert(billingCycles)
    .values({
      cardId,
      startDate,
      endDate,
      dueDate,
      status: 'running',
    })
    .returning();

  return newCycle;
}

export async function syncCycleStatus(cycleId: string) {
  const [cycle] = await db
    .select()
    .from(billingCycles)
    .where(eq(billingCycles.id, cycleId))
    .limit(1);

  if (!cycle) return;

  const now = new Date();
  let newStatus = cycle.status;

  if (cycle.status === 'running' && now > cycle.endDate) {
    newStatus = 'pending_confirmation';
  } else if (cycle.status === 'pending_confirmation' && now > cycle.dueDate) {
    // This logic might be more complex if we have payment tracking
    // For now, if it's past due date and not paid, it's overdue
    newStatus = 'overdue';
  }

  if (newStatus !== cycle.status) {
    await db
      .update(billingCycles)
      .set({ status: newStatus })
      .where(eq(billingCycles.id, cycleId));
  }
}

