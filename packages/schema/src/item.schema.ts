import { z } from 'zod';
import { type Item, ItemType } from '@ingexpert/database';
import { BasePaginationSchema } from './pagination.schema';

export { ItemType } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  location: z.string().min(1),
  stock: z.number().default(0),
  unit: z.string().min(1),
  type: z.nativeEnum(ItemType),
  imageUrl: z.string().optional(),
});
export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;

export const ItemPaginationSchema = BasePaginationSchema.extend({
  filters: z
    .object({
      type: z.string().optional(),
      unit: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
});
export type ItemPaginationDto = z.infer<typeof ItemPaginationSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of an Item returned by the API.
 * Derived from the Prisma `Item` model: adding a new DB column will cause a
 * type error in `ItemsService.mapItem()` until the mapping is updated.
 * `stock` is overridden from `Decimal` → `number` (serialized by the service).
 */
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

/** Global unfiltered inventory statistics (for summary cards). */
export type ItemStats = {
  total: number;
  products: number;
  equipment: number;
  tools: number;
  kits: number;
  lowStock: number;
};

/** Per-type item counts, optionally filtered by search/location (for tab badges). */
export type ItemCounts = {
  ALL: number;
  PRODUCT: number;
  EQUIPMENT: number;
  TOOL: number;
  KIT: number;
};
