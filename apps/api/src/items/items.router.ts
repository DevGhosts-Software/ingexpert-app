import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { ItemsService } from './items.service';
import { CreateItemSchema, ItemPaginationSchema, UpdateItemSchema } from '@ingexpert/schema';
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
        .output(z.unknown())
        .query(async ({ input }) => {
          return this.itemsService.findPaginated(input);
        }),

      create: this.trpc.adminProcedure
        .meta({
          openapi: { method: 'POST', path: '/items', tags: ['items'], summary: 'Create item' },
        })
        .input(CreateItemSchema)
        .output(z.unknown())
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
        .output(z.unknown())
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return this.itemsService.update(id, data);
        }),

      // DELETE /items/:id — primitive input, excluded from OpenAPI spec
      remove: this.trpc.adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
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
        .mutation(async ({ input }) => {
          await this.itemsService.importMany(input);
          return { success: true };
        }),

      getStats: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/items/stats',
            tags: ['items'],
            summary: 'Get item statistics',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return this.itemsService.getStats();
        }),

      getCounts: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/items/counts',
            tags: ['items'],
            summary: 'Get item type counts',
          },
        })
        .input(
          z.object({
            search: z.string().optional(),
            location: z.string().optional(),
          }),
        )
        .output(z.unknown())
        .query(async ({ input }) => {
          return this.itemsService.getCounts(input.search, input.location);
        }),

      getLocations: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/items/locations',
            tags: ['items'],
            summary: 'Get distinct item locations',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return this.itemsService.getLocations();
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
        .output(z.unknown())
        .query(async () => {
          return this.itemsService.findAll();
        }),
    });
  }
}
