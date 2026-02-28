// apps/api/src/movements/movements.router.ts
import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { MovementsService } from './movements.service';
import {
  CreateMovementSchema,
  UpdateMovementSchema,
  MovementFiltersSchema,
} from '@ingexpert/schema';
import { UserRole } from '@ingexpert/database';
import { z } from 'zod';

@Injectable()
export class MovementsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly movementsService: MovementsService,
  ) {}

  public get router() {
    return this.trpc.router({
      getAll: this.trpc.protectedProcedure
        .input(MovementFiltersSchema.optional())
        .query(async ({ input, ctx }) => {
          // Non-admins can only see their own movements
          const filters =
            ctx.user.role !== UserRole.ADMIN ? { ...input, createdById: ctx.user.id } : input;
          return this.movementsService.findAll(filters);
        }),

      getById: this.trpc.protectedProcedure
        .input(z.string().uuid('El ID del movimiento debe ser un UUID válido.'))
        .query(async ({ input }) => {
          return this.movementsService.findOne(input);
        }),

      getStats: this.trpc.protectedProcedure
        .input(MovementFiltersSchema.optional())
        .query(async ({ input, ctx }) => {
          const filters =
            ctx.user.role !== UserRole.ADMIN ? { ...input, createdById: ctx.user.id } : input;
          return this.movementsService.getStats(filters);
        }),

      getProjects: this.trpc.protectedProcedure.query(async () => {
        return this.movementsService.getProjects();
      }),

      create: this.trpc.protectedProcedure
        .input(CreateMovementSchema)
        .mutation(async ({ input, ctx }) => {
          return this.movementsService.create(input, ctx.user.id);
        }),

      update: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().uuid(), data: UpdateMovementSchema }))
        .mutation(async ({ input }) => {
          return this.movementsService.update(input.id, input.data);
        }),
    });
  }
}
