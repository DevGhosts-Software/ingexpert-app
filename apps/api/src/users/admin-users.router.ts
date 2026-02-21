import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { AdminUsersService } from './services/admin-users.service';
import { z } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from '@ingexpert/schema';

@Injectable()
export class AdminUsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  public get router() {
    return this.trpc.router({
      create: this.trpc.adminProcedure.input(CreateUserSchema).mutation(async ({ input }) => {
        return await this.adminUsersService.create(input);
      }),

      list: this.trpc.adminProcedure.query(async () => {
        return await this.adminUsersService.findAll();
      }),

      getStats: this.trpc.adminProcedure.query(async () => {
        return await this.adminUsersService.getStats();
      }),

      getWorkAreas: this.trpc.adminProcedure.query(async () => {
        return await this.adminUsersService.getWorkAreas();
      }),

      get: this.trpc.adminProcedure.input(z.uuid()).query(async ({ input }) => {
        return await this.adminUsersService.findOne(input);
      }),

      update: this.trpc.adminProcedure
        .input(
          z.object({
            id: z.uuid(),
            data: UpdateUserSchema,
          }),
        )
        .mutation(async ({ input }) => {
          return await this.adminUsersService.update(input.id, input.data);
        }),

      remove: this.trpc.adminProcedure.input(z.uuid()).mutation(async ({ input }) => {
        return await this.adminUsersService.remove(input);
      }),

      updatePassword: this.trpc.protectedProcedure
        .input(
          z.object({
            id: z.uuid(),
            password: z.string(),
          }),
        )
        .mutation(async ({ input }) => {
          return await this.adminUsersService.changePassword(input.id, input.password);
        }),
    });
  }
}
