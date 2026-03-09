// apps/api/src/movements/movements.router.ts
import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { MovementsService } from './movements.service';
import {
  CreateMovementSchema,
  MovementEntityWithDetailsSchema,
  MovementFiltersSchema,
  MovementHeaderEntitySchema,
  MovementProjectSchema,
  MovementStatsSchema,
  UpdateMovementSchema,
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
        .meta({
          openapi: {
            method: 'GET',
            path: '/movements',
            tags: ['movements'],
            summary: 'List movements',
          },
        })
        .input(MovementFiltersSchema.optional())
        .output(z.array(MovementHeaderEntitySchema))
        .query(async ({ input, ctx }) => {
          // Non-admins can only see their own movements
          const filters =
            ctx.user.role !== UserRole.ADMIN ? { ...input, createdById: ctx.user.id } : input;
          return this.movementsService.findAll(filters);
        }),

      // Primitive input — excluded from OpenAPI spec
      getById: this.trpc.protectedProcedure
        .input(z.string().uuid('El ID del movimiento debe ser un UUID válido.'))
        .query(async ({ input }) => {
          return this.movementsService.findOne(input);
        }),

      getStats: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/movements/stats',
            tags: ['movements'],
            summary: 'Get movement statistics',
          },
        })
        .input(MovementFiltersSchema.optional())
        .output(MovementStatsSchema)
        .query(async ({ input, ctx }) => {
          const filters =
            ctx.user.role !== UserRole.ADMIN ? { ...input, createdById: ctx.user.id } : input;
          return this.movementsService.getStats(filters);
        }),

      getProjects: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/movements/projects',
            tags: ['movements'],
            summary: 'Get projects with movements',
          },
        })
        .output(z.array(MovementProjectSchema))
        .query(async () => {
          return this.movementsService.getProjects();
        }),

      create: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/movements',
            tags: ['movements'],
            summary: 'Create movement',
          },
        })
        .input(CreateMovementSchema)
        .output(MovementEntityWithDetailsSchema)
        .mutation(async ({ input, ctx }) => {
          return this.movementsService.create(input, ctx.user.id);
        }),

      update: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'PATCH',
            path: '/movements',
            tags: ['movements'],
            summary: 'Update movement',
          },
        })
        .input(z.object({ id: z.string().uuid(), data: UpdateMovementSchema }))
        .output(MovementEntityWithDetailsSchema)
        .mutation(async ({ input }) => {
          return this.movementsService.update(input.id, input.data);
        }),
    });
  }
}
