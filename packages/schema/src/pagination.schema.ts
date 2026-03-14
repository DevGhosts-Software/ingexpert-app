import { z } from 'zod';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const BasePaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});
export type BasePaginationInput = z.infer<typeof BasePaginationSchema>;

// ─── Shared output schemas ────────────────────────────────────────────────────

export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/** Wraps an item schema in a paginated `{ data, meta }` response. */
export const paginatedSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
