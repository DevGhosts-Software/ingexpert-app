import { z } from 'zod';
import { type Item, type Movement, type MovementDetail, MovementType } from '@ingexpert/database';

export { MovementType } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const MovementDetailSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const CreateMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  destination: z.string().optional(),
  responsibleDeliveryId: z.string().uuid().optional(),
  responsibleReceiptId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  details: z.array(MovementDetailSchema).min(1),
});

export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;

export const UpdateMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  destination: z.string().optional(),
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
  entries: number;
  exits: number;
  thisMonth: number;
};

/** Header row returned by getAll — no item details, includes joined project/creator names. */
export type MovementHeaderEntity = Omit<Movement, 'date'> & {
  date: string;
  itemsCount: number;
  projectName: string | null;
  creatorName: string | null;
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
