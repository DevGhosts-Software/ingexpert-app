import { z } from 'zod';

export const CreateDeckSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  desiredRetention: z.number().min(0.1).max(0.99).optional(),
  leechThreshold: z.number().int().min(1).optional(),
  deckOptions: z.record(z.string(), z.any()).optional(),
  newCardsLimit: z.number().int().min(0).optional(),
  reviewCardsLimit: z.number().int().min(0).optional(),
  icon: z.string().max(10).optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  parentId: z.uuid().optional().nullable(),
  position: z.number().int().optional(),
  collectionId: z.uuid().optional().nullable(),
});

export type CreateDeckDto = z.infer<typeof CreateDeckSchema>;

export const UpdateDeckSchema = CreateDeckSchema.partial();
export type UpdateDeckDto = z.infer<typeof UpdateDeckSchema>;
