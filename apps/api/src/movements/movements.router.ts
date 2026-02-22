// apps/api/src/movements/movements.router.ts
import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { MovementsService } from './movements.service';
import { CreateMovementSchema, UpdateMovementSchema } from '@ingexpert/schema';
import { z } from 'zod';

@Injectable()
export class MovementsRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly movementsService: MovementsService,
    ) { }

    public get router() {
        return this.trpc.router({

            getAll: this.trpc.protectedProcedure.query(async () => {
                return this.movementsService.findAll();
            }),

            getById: this.trpc.protectedProcedure
                .input(z.string().uuid('El ID del movimiento debe ser un UUID válido.'))
                .query(async ({ input }) => {
                    return this.movementsService.findOne(input);
                }),

            getStats: this.trpc.protectedProcedure.query(async () => {
                return this.movementsService.getStats();
            }),

            getProjects: this.trpc.protectedProcedure.query(async () => {
                return this.movementsService.getProjects();
            }),

            getStaff: this.trpc.protectedProcedure.query(async () => {
                return this.movementsService.getStaff();
            }),

            create: this.trpc.protectedProcedure
                .input(CreateMovementSchema)
                .mutation(async ({ input }) => {
                    return this.movementsService.create(input);
                }),

            update: this.trpc.protectedProcedure
                .input(z.object({ id: z.string().uuid(), data: UpdateMovementSchema }))
                .mutation(async ({ input }) => {
                    return this.movementsService.update(input.id, input.data);
                }),
        });
    }
}
