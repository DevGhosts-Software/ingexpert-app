import { z } from 'zod';

export const KitComponentSchema = z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
});

export const SetKitComponentsSchema = z.object({
    kit_id: z.string().uuid(),
    components: z.array(KitComponentSchema).min(1),
});

export type SetKitComponentsDto = z.infer<typeof SetKitComponentsSchema>;
