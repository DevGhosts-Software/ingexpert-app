import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { KitsService } from './kits.service';
import { SetKitComponentsSchema } from '@ingexpert/schema';

@Injectable()
export class KitsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly kitsService: KitsService,
  ) {}

  public get router() {
    return this.trpc.router({
      getComponents: this.trpc.protectedProcedure
        .input(z.string().uuid())
        .query(async ({ input }) => {
          return this.kitsService.getComponents(input);
        }),

      setComponents: this.trpc.protectedProcedure
        .input(SetKitComponentsSchema)
        .mutation(async ({ input }) => {
          return this.kitsService.setComponents(input);
        }),

      clearKit: this.trpc.protectedProcedure
        .input(z.string().uuid())
        .mutation(async ({ input }) => {
          await this.kitsService.clearKit(input);
          return { success: true };
        }),
    });
  }
}
