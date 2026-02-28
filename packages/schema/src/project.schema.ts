import { z } from 'zod';
import { type Project } from '@ingexpert/database';
import { BasePaginationSchema } from './pagination.schema';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  address: z.string().min(1),
  managerId: z.string().uuid(),
});
export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

export const ProjectPaginationSchema = BasePaginationSchema;
export type ProjectPaginationInput = z.infer<typeof ProjectPaginationSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a Project returned by the API.
 * `manager` is a flattened name from the related User — mapped in the service.
 */
export type ProjectEntity = Project & { manager: string | null };
