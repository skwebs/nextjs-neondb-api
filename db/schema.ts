import { pgTable, serial, text, timestamp, integer, decimal, pgEnum, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const billingCycleStatusEnum = pgEnum('billing_cycle_status', [
  'running',
  'pending_confirmation',
  'generated',
  'partially_paid',
  'paid',
  'overdue',
]);

// Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const creditCards = pgTable('credit_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  last4Digits: text('last_4_digits').notNull(),
  statementDay: integer('statement_day').notNull(), // e.g., 15th of the month
  dueDayOffset: integer('due_day_offset').notNull(), // e.g., 20 days after statement
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('cc_user_id_idx').on(table.userId),
}));

export const billingCycles = pgTable('billing_cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id')
    .notNull()
    .references(() => creditCards.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(), // statement date
  dueDate: timestamp('due_date').notNull(),
  status: billingCycleStatusEnum('status').default('running').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardIdIdx: index('bc_card_id_idx').on(table.cardId),
}));

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cardId: uuid('card_id')
    .notNull()
    .references(() => creditCards.id, { onDelete: 'cascade' }),
  billingCycleId: uuid('billing_cycle_id')
    .references(() => billingCycles.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  transactionDatetime: timestamp('transaction_datetime').notNull(),
  settlementDate: timestamp('settlement_date'), // null means not yet settled
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('tx_user_id_idx').on(table.userId),
  cardIdIdx: index('tx_card_id_idx').on(table.cardId),
  billingCycleIdIdx: index('tx_bc_id_idx').on(table.billingCycleId),
  dateIdx: index('tx_date_idx').on(table.transactionDatetime),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  creditCards: many(creditCards),
  transactions: many(transactions),
}));

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  user: one(users, {
    fields: [creditCards.userId],
    references: [users.id],
  }),
  billingCycles: many(billingCycles),
  transactions: many(transactions),
}));

export const billingCyclesRelations = relations(billingCycles, ({ one, many }) => ({
  card: one(creditCards, {
    fields: [billingCycles.cardId],
    references: [creditCards.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  card: one(creditCards, {
    fields: [transactions.cardId],
    references: [creditCards.id],
  }),
  billingCycle: one(billingCycles, {
    fields: [transactions.billingCycleId],
    references: [billingCycles.id],
  }),
}));
