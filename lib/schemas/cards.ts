import { z } from 'zod';

export const cardSchema = z.object({
  name: z.string().min(1),
  last4Digits: z.string().length(4).regex(/^\d+$/),
  statementDay: z.number().min(1).max(31),
  dueDayOffset: z.number().min(1).max(60),
});

export const updateCardSchema = cardSchema.partial();

export type CardInput = z.infer<typeof cardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
