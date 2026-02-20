import { z } from 'zod';

export const BasePaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});

export type BasePaginationInput = z.infer<typeof BasePaginationSchema>;
