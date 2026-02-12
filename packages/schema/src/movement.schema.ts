import { z } from 'zod';
import { MovementType } from '@ingexpert/database';

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

export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;
