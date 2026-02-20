import { z } from 'zod';
import { type Movement, type MovementDetail, MovementType } from '@ingexpert/database';

export { MovementType } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const MovementDetailSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const CreateMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  personalName: z.string().min(1),
  destination: z.string().optional(),
  responsibleDeliveryId: z.string().uuid().optional(),
  responsibleReceiptId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  details: z.array(MovementDetailSchema).min(1),
});


/*
export const MovementDetailEntitySchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  movementId: z.string().uuid(),
});

export const MovementEntitySchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(MovementType),
  personalName: z.string(),
  destination: z.string().optional(),
  responsibleDeliveryId: z.string().uuid().optional(),
  responsibleReceiptId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  details: z.array(MovementDetailEntitySchema),
});
export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;
*/


// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a Movement returned by the API.
 * Derived from the Prisma `Movement` model.
 * `date` is overridden from `Date` → `string` (ISO 8601 serialized over JSON).
 */
export type MovementEntity = Omit<Movement, 'date'> & { date: string };

/**
 * Wire representation of a MovementDetail returned by the API.
 * `quantity` is overridden from `Decimal` → `number` (serialized by the service).
 */
export type MovementDetailEntity = Omit<MovementDetail, 'quantity'> & { quantity: number };
