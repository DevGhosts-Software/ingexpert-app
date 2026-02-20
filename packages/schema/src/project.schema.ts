import { z } from 'zod';
import { type Project } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  address: z.string().min(1),
  manager: z.string().min(1),
});
export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a Project returned by the API.
 * Derived from the Prisma `Project` model (scalar fields only — no relations).
 */
export type ProjectEntity = Project;
