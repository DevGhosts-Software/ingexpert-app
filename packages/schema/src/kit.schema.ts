import { z } from 'zod';
import type { KitDetail, Item } from '@ingexpert/database';

export const KitComponentSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const SetKitComponentsSchema = z.object({
  kit_id: z.string().uuid(),
  components: z.array(KitComponentSchema).min(1),
});

export type SetKitComponentsDto = z.infer<typeof SetKitComponentsSchema>;

// ─── Entities ────────────────────────────────────────────────────────────────

/** Wire representation of a KitDetail row with its nested component Item. */
export type KitComponentEntity = Omit<KitDetail, 'quantity'> & {
  quantity: number;
  component: Omit<Item, 'stock'> & { stock: number };
};
