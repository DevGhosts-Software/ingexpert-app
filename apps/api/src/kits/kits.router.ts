import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { KitsService } from './kits.service';
import { KitSummarySchema } from '@ingexpert/schema';

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
    });
  }
}
