import { z } from 'zod';

const journalLineSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  memo: z.string().optional(),
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    date: z.string().optional(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'At least two lines are required'),
  }),
});

export const updateJournalEntrySchema = z.object({
  body: z.object({
    date: z.string().optional(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2).optional(),
  }),
});

export const journalEntryIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Journal entry id is required'),
  }),
});
