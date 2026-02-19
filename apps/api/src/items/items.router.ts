import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { ItemsService } from './items.service';
import {
    CreateItemSchema,
    UpdateItemSchema,
} from '@ingexpert/schema';
import { z } from 'zod';

@Injectable()
export class ItemsRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly itemsService: ItemsService,
    ) { }

    public get router() {
        return this.trpc.router({
            // GET /items
            list: this.trpc.protectedProcedure.query(async () => {
                return this.itemsService.findAll();
            }),

            // POST /items
            create: this.trpc.protectedProcedure
                .input(CreateItemSchema)
                .mutation(async ({ input }) => {
                    return this.itemsService.create(input);
                }),

            // PATCH /items/:id
            update: this.trpc.protectedProcedure
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
            remove: this.trpc.protectedProcedure
                .input(z.string().uuid())
                .mutation(async ({ input }) => {
                    return this.itemsService.remove(input);
                }),

            // Batch create (para import desde Excel)
            createBatch: this.trpc.protectedProcedure
                .input(z.array(CreateItemSchema))
                .mutation(async ({ input }) => {
                    await this.itemsService.createBatch(input);
                    return { success: true };
                }),
            // Batch upsert (para import desde Excel)
            upsertManyByName: this.trpc.protectedProcedure
                .input(z.array(CreateItemSchema))
                .mutation(async ({ input }) => {
                    await this.itemsService.upsertManyByName(input);
                    return { success: true };
                }),
        });
    }
}
