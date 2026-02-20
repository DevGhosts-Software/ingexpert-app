import { z } from 'zod';
import { ItemType } from '@ingexpert/database';
import { BasePaginationSchema } from './pagination.schema';

export { ItemType } from '@ingexpert/database';

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  location: z.string().min(1),
  stock: z.number().default(0),
  unit: z.string().min(1),
  type: z.nativeEnum(ItemType),
  imageUrl: z.string().optional(),
});

/**
 * Represents an Item as returned by the API over the wire.
 * `stock` is always a plain `number` (Prisma Decimal is serialized in the service).
 * `imageUrl` is always a string (empty string when not set).
 * This is the shared contract between API and Frontend — never use raw Prisma types
 * or `any` as procedure return types.
 */
export const ItemEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  location: z.string(),
  stock: z.number(),
  unit: z.string(),
  type: z.nativeEnum(ItemType),
  imageUrl: z.string(),
});
export type ItemEntity = z.infer<typeof ItemEntitySchema>;

/** Global unfiltered inventory statistics (for summary cards). */
export const ItemStatsSchema = z.object({
  total: z.number(),
  products: z.number(),
  equipment: z.number(),
  tools: z.number(),
  kits: z.number(),
  lowStock: z.number(),
});
export type ItemStats = z.infer<typeof ItemStatsSchema>;

/** Per-type item counts, optionally filtered by search/location (for tab badges). */
export const ItemCountsSchema = z.object({
  ALL: z.number(),
  PRODUCT: z.number(),
  EQUIPMENT: z.number(),
  TOOL: z.number(),
  KIT: z.number(),
});
export type ItemCounts = z.infer<typeof ItemCountsSchema>;

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

export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;
