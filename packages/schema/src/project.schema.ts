import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  address: z.string().min(1),
  manager: z.string().min(1),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;
