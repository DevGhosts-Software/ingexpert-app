import { z } from 'zod';
import { ItemType } from '@ingexpert/database';
import {basePaginationSchema} from "./pagination.schema";

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  location: z.string().min(1),
  stock: z.number().default(0),
  unit: z.string().min(1),
  type: z.nativeEnum(ItemType),
  imageUrl: z.string().url().optional(),
});


export const itemPaginationSchema = basePaginationSchema.extend({
  filters: z.object({
    type: z.string().optional(),
    unit: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});


export type itemPaginationDto=z.infer<typeof itemPaginationSchema>;

export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;
