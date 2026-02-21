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
      list: this.trpc.protectedProcedure.input(ItemPaginationSchema).query(async ({ input }) => {
        return this.itemsService.findPaginated(input);
      }),

      // POST /items
      create: this.trpc.adminProcedure.input(CreateItemSchema).mutation(async ({ input }) => {
        return this.itemsService.create(input);
      }),

      // PATCH /items/:id
      update: this.trpc.adminProcedure
        .input(
          UpdateItemSchema.extend({
            id: z.string().uuid(),
          }),
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return this.itemsService.update(id, data);
        }),

      // DELETE /items/:id
      remove: this.trpc.adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
        return this.itemsService.remove(input);
      }),

      // Batch create (para import desde Excel)
      createBatch: this.trpc.adminProcedure
        .input(z.array(CreateItemSchema))
        .mutation(async ({ input }) => {
          await this.itemsService.createBatch(input);
          return { success: true };
        }),
      // Batch upsert (para import desde Excel)
      upsertManyByName: this.trpc.adminProcedure
        .input(z.array(CreateItemSchema))
        .mutation(async ({ input }) => {
          await this.itemsService.upsertManyByName(input);
          return { success: true };
        }),

      getStats: this.trpc.protectedProcedure.query(async () => {
        return this.itemsService.getStats();
      }),

      getCounts: this.trpc.protectedProcedure
        .input(
          z.object({
            search: z.string().optional(),
            location: z.string().optional(),
          }),
        )
        .query(async ({ input }) => {
          return this.itemsService.getCounts(input.search, input.location);
        }),

      getLocations: this.trpc.protectedProcedure.query(async () => {
        return this.itemsService.getLocations();
      }),

      getAll: this.trpc.adminProcedure.query(async () => {
        return this.itemsService.findAll();
      }),
    });
  }
}
