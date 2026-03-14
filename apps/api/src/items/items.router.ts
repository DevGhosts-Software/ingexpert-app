import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { ItemsService } from './items.service';
import {
  CreateItemSchema,
  ItemEntitySchema,
  ItemListSchema,
  ItemPaginationSchema,
  UpdateItemSchema,
} from '@ingexpert/schema';
import { z } from 'zod';

@Injectable()
export class ItemsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly itemsService: ItemsService,
  ) {}

  public get router() {
    return this.trpc.router({
      list: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/items/list',
            tags: ['items'],
            summary: 'List items (paginated with filters)',
          },
        })
        .input(ItemPaginationSchema)
        .output(ItemListSchema)
        .query(async ({ input }) => {
          return this.itemsService.findPaginated(input);
        }),

      create: this.trpc.adminProcedure
        .meta({
          openapi: { method: 'POST', path: '/items', tags: ['items'], summary: 'Create item' },
        })
        .input(CreateItemSchema)
        .output(ItemEntitySchema)
        .mutation(async ({ input }) => {
          return this.itemsService.create(input);
        }),

      update: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'PATCH',
            path: '/items/{id}',
            tags: ['items'],
            summary: 'Update item',
          },
        })
        .input(
          UpdateItemSchema.extend({
            id: z.string().uuid(),
          }),
        )
        .output(ItemEntitySchema)
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return this.itemsService.update(id, data);
        }),

      // DELETE /items/:id — primitive input, excluded from OpenAPI spec
      remove: this.trpc.adminProcedure
        .input(z.string().uuid())
        .output(ItemEntitySchema)
        .mutation(async ({ input }) => {
          return this.itemsService.remove(input);
        }),

      // Array inputs — excluded from OpenAPI spec
      createBatch: this.trpc.adminProcedure
        .input(z.array(CreateItemSchema))
        .mutation(async ({ input }) => {
          await this.itemsService.createBatch(input);
          return { success: true };
        }),
      importMany: this.trpc.adminProcedure
        .input(z.array(CreateItemSchema))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
          await this.itemsService.importMany(input);
          return { success: true };
        }),

      getAll: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/items/all',
            tags: ['items'],
            summary: 'Get all items (admin)',
          },
        })
        .output(z.array(ItemEntitySchema))
        .query(async () => {
          return this.itemsService.findAll();
        }),
    });
  }
}
