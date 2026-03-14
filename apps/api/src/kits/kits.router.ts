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
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
          await this.kitsService.setComponents(input);
          return { success: true };
        }),

      // Primitive input — excluded from OpenAPI spec
      clearKit: this.trpc.protectedProcedure
        .input(z.string().uuid())
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
          await this.kitsService.clearKit(input);
          return { success: true };
        }),

      // Array input — excluded from OpenAPI spec
      importMany: this.trpc.adminProcedure
        .input(z.array(KitImportRowSchema))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
          await this.kitsService.importMany(input);
          return { success: true };
        }),
    });
  }
}
