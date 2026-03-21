import { z } from 'zod';
import { type Item, type Movement, type MovementDetail, MovementType } from '@ingexpert/database';
import { ItemEntitySchema } from './item.schema';

export { MovementType } from '@ingexpert/database';

const USER_CREATABLE_MOVEMENT_TYPES = [
  MovementType.EXIT,
  MovementType.PURCHASE,
  MovementType.RETURN,
  MovementType.WRITEOFF,
] as const;

const UserCreatableMovementTypeSchema = z.enum(
  USER_CREATABLE_MOVEMENT_TYPES.map((t) => t as string) as [string, ...string[]],
);

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const MovementDetailSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const MovementFiltersSchema = z.object({
  createdById: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type MovementFiltersDto = z.infer<typeof MovementFiltersSchema>;

export const CreateMovementSchema = z.object({
  type: UserCreatableMovementTypeSchema,
  destination: z.string().optional(),
  observations: z.string().optional(),
  responsibleDeliveryId: z.string().uuid().optional(),
  responsibleReceiptId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  details: z.array(MovementDetailSchema).min(1),
});

export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;

export const UpdateMovementSchema = z.object({
  type: UserCreatableMovementTypeSchema,
  destination: z.string().optional(),
  observations: z.string().optional(),
  responsibleDeliveryId: z.string().uuid().optional(),
  responsibleReceiptId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  details: z.array(MovementDetailSchema).min(1),
});

export type UpdateMovementDto = z.infer<typeof UpdateMovementSchema>;

export type StaffEntity = {
  id: string;
  name: string | null;
};

// ─── Entities (Lo único que el API devuelve al Frontend) ──────────────────────

export type MovementStats = {
  total: number;
  purchases: number;
  returns: number;
  exits: number;
  writeoffs: number;
  thisMonth: number;
};

/** Header row returned by getAll — no item details, includes joined project/creator names. */
export type MovementHeaderEntity = Omit<Movement, 'date'> & {
  date: string;
  itemsCount: number;
  projectName: string | null;
  creatorName: string | null;
  responsibleDeliveryName: string | null;
  responsibleReceiptName: string | null;
};

/** Full entity returned by getById — includes item details and responsible person names. */
export type MovementEntityWithDetails = Omit<Movement, 'date'> & {
  date: string;
  itemsCount: number;
  projectName: string | null;
  creatorName: string | null;
  responsibleDeliveryName: string | null;
  responsibleReceiptName: string | null;
  details: Array<
    Omit<MovementDetail, 'quantity'> & {
      quantity: number;
      item: Omit<Item, 'stock'> & { stock: number };
    }
  >;
};

// ─── Output schemas ───────────────────────────────────────────────────────────

const movementBaseFields = {
  id: z.string().uuid(),
  type: z.nativeEnum(MovementType),
  createdById: z.string().uuid(),
  destination: z.string().nullable(),
  observations: z.string().nullable(),
  responsibleDeliveryId: z.string().uuid().nullable(),
  responsibleReceiptId: z.string().uuid().nullable(),
  date: z.string(),
  projectId: z.string().uuid().nullable(),
  itemsCount: z.number(),
  projectName: z.string().nullable(),
  creatorName: z.string().nullable(),
  responsibleDeliveryName: z.string().nullable(),
  responsibleReceiptName: z.string().nullable(),
};

export const MovementHeaderEntitySchema = z.object(movementBaseFields);

const MovementDetailEntitySchema = z.object({
  id: z.string().uuid(),
  movementId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number(),
  item: ItemEntitySchema,
});

export const MovementEntityWithDetailsSchema = z.object({
  ...movementBaseFields,
  details: z.array(MovementDetailEntitySchema),
});

export const MovementStatsSchema = z.object({
  total: z.number(),
  purchases: z.number(),
  returns: z.number(),
  exits: z.number(),
  writeoffs: z.number(),
  thisMonth: z.number(),
});

export const MovementProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
