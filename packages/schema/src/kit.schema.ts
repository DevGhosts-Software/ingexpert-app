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

/** One row from the "Kits" sheet of an exported workbook. */
export const KitImportRowSchema = z.object({
  kitCode: z.string().min(1),
  kitName: z.string().min(1),
  componentCode: z.string().min(1),
  componentName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});
export type KitImportRow = z.infer<typeof KitImportRowSchema>;

// ─── Entities ────────────────────────────────────────────────────────────────

/** Wire representation of a KitDetail row with its nested component Item. */
export type KitComponentEntity = Omit<KitDetail, 'quantity'> & {
  quantity: number;
  component: Omit<Item, 'stock'> & { stock: number };
};

// ─── Output schemas ───────────────────────────────────────────────────────────

/** Component summary as returned by getAllWithComponents (mapped by the service). */
const KitSummaryComponentSchema = z.object({
  name: z.string(),
  code: z.string(),
  quantity: z.number(),
  unit: z.string(),
});

export const KitSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  components: z.array(KitSummaryComponentSchema),
});

export const KitComponentEntitySchema = z.object({
  id: z.string().uuid(),
  kitId: z.string().uuid(),
  componentId: z.string().uuid(),
  quantity: z.number(),
  component: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    location: z.string(),
    stock: z.number(),
    unit: z.string(),
    type: z.enum(['PRODUCT', 'EQUIPMENT', 'TOOL', 'KIT']),
    imageUrl: z.string(),
  }),
});
