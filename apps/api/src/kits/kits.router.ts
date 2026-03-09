import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { KitsService } from './kits.service';
import { KitImportRowSchema, KitSummarySchema, SetKitComponentsSchema } from '@ingexpert/schema';

@Injectable()
export class KitsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly kitsService: KitsService,
  ) {}

  public get router() {
    return this.trpc.router({
      // Primitive input — excluded from OpenAPI spec
      getComponents: this.trpc.protectedProcedure
        .input(z.string().uuid())
        .query(async ({ input }) => {
          return this.kitsService.getComponents(input);
        }),

      getAllWithComponents: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/kits',
            tags: ['kits'],
            summary: 'Get all kits with their components',
          },
        })
        .output(z.array(KitSummarySchema))
        .query(async () => {
          return this.kitsService.getAllWithComponents();
        }),

      setComponents: this.trpc.protectedProcedure
        .input(SetKitComponentsSchema)
        .mutation(async ({ input }) => {
          return this.kitsService.setComponents(input);
        }),

      // Primitive input — excluded from OpenAPI spec
      clearKit: this.trpc.protectedProcedure
        .input(z.string().uuid())
        .mutation(async ({ input }) => {
          await this.kitsService.clearKit(input);
          return { success: true };
        }),

      // Array input — excluded from OpenAPI spec
      importMany: this.trpc.adminProcedure
        .input(z.array(KitImportRowSchema))
        .mutation(async ({ input }) => {
          await this.kitsService.importMany(input);
          return { success: true };
        }),
    });
  }
}
