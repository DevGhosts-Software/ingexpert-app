import { z } from 'zod';

export const SyncOperationType = z.enum(['create', 'update', 'delete']);
export const SyncEntityType = z.enum(['Card', 'Deck', 'Review']);

export const SyncOperationSchema = z.object({
  entityId: z.uuid(),
  entityType: SyncEntityType,
  operation: SyncOperationType,
  data: z.record(z.string(), z.any()),
  previousVersion: z.number().int(),
  timestamp: z.iso.datetime().transform((str) => new Date(str)),
  clientId: z.string(),
  idempotencyKey: z.string().optional(),
  rating: z.number().optional(),
  clientStateAfter: z.record(z.string(), z.any()).optional(),
  cardId: z.uuid().optional(),
});

export type SyncOperationDto = z.infer<typeof SyncOperationSchema>;

export const SyncBatchSchema = z.array(SyncOperationSchema);
export type SyncBatchDto = z.infer<typeof SyncBatchSchema>;
