import { z } from 'zod';

export const transactionSchema = z.object({
  cardId: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  amount: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format. Use "10.00" format.')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than zero'),
  transactionDatetime: z.string().datetime(),
  settlementDate: z.string().datetime().optional().nullable(),
});

export const updateTransactionSchema = transactionSchema.omit({ cardId: true }).partial();

export type TransactionInput = z.infer<typeof transactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
