import { z } from 'zod';
import { CardState } from '@rikal/database';

export const CreateCardSchema = z.object({
  id: z.uuid().optional(),
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(4000),
  deckId: z.uuid(),
  templateId: z.uuid().optional().nullable(),
  markdown: z.boolean().optional(),
  frontMediaUrls: z.array(z.url().max(500)).optional(),
  backMediaUrls: z.array(z.url().max(500)).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  // Optional sync fields
  due: z
    .date()
    .optional()
    .or(z.iso.datetime().transform((str) => new Date(str))),
  stability: z.number().optional(),
  difficulty: z.number().optional(),
  state: z.nativeEnum(CardState).optional(),
  reps: z.number().int().optional(),
  lapses: z.number().int().optional(),
  lastReviewedAt: z
    .date()
    .optional()
    .or(z.iso.datetime().transform((str) => new Date(str))),
});

export type CreateCardDto = z.infer<typeof CreateCardSchema>;

export const UpdateCardSchema = CreateCardSchema.partial();
export type UpdateCardDto = z.infer<typeof UpdateCardSchema>;

export const SyncReviewSchema = z.object({
  cardId: z.uuid(),
  rating: z.number().min(1).max(4),
  reviewTimeMs: z.number().min(0).max(300000),
  clientStateAfter: z.object({
    difficulty: z.number(),
    stability: z.number(),
    reps: z.number(),
    lapses: z.number(),
    lastReview: z.iso.datetime().transform((str) => new Date(str)),
    due: z.iso.datetime().transform((str) => new Date(str)),
    state: z.nativeEnum(CardState),
  }),
  clientId: z.string(),
  version: z.number().int(),
});

export type SyncReviewDto = z.infer<typeof SyncReviewSchema>;
