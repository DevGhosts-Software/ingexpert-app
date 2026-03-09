import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { AdminUsersService } from './services/admin-users.service';
import { z } from 'zod';
import {
  CreateUserSchema,
  CreateUserWithoutAuthSchema,
  GrantAuthSchema,
  UpdateUserSchema,
} from '@ingexpert/schema';

@Injectable()
export class AdminUsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  public get router() {
    return this.trpc.router({
      create: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/admin/users',
            tags: ['admin-users'],
            summary: 'Create user with auth account',
          },
        })
        .input(CreateUserSchema)
        .output(z.unknown())
        .mutation(async ({ input }) => {
          return await this.adminUsersService.create(input);
        }),

      createWithoutAuth: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/admin/users/no-auth',
            tags: ['admin-users'],
            summary: 'Create user without auth account',
          },
        })
        .input(CreateUserWithoutAuthSchema)
        .output(z.unknown())
        .mutation(async ({ input }) => {
          return await this.adminUsersService.createWithoutAuth(input);
        }),

      grantAuth: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/admin/users/grant-auth',
            tags: ['admin-users'],
            summary: 'Grant auth account to existing user',
          },
        })
        .input(GrantAuthSchema)
        .output(z.unknown())
        .mutation(async ({ input }) => {
          return await this.adminUsersService.grantAuth(input);
        }),

      // Primitive input — excluded from OpenAPI spec
      revokeAuth: this.trpc.adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
        return await this.adminUsersService.revokeAuth(input);
      }),

      list: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/admin/users',
            tags: ['admin-users'],
            summary: 'List all users',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return await this.adminUsersService.findAll();
        }),

      getStats: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/admin/users/stats',
            tags: ['admin-users'],
            summary: 'Get user statistics',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return await this.adminUsersService.getStats();
        }),

      getWorkAreas: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/admin/users/work-areas',
            tags: ['admin-users'],
            summary: 'Get available work areas',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return await this.adminUsersService.getWorkAreas();
        }),

      // Primitive input — excluded from OpenAPI spec
      get: this.trpc.adminProcedure.input(z.uuid()).query(async ({ input }) => {
        return await this.adminUsersService.findOne(input);
      }),

      update: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'PATCH',
            path: '/admin/users',
            tags: ['admin-users'],
            summary: 'Update user',
          },
        })
        .input(z.object({ id: z.uuid(), data: UpdateUserSchema }))
        .output(z.unknown())
        .mutation(async ({ input }) => {
          return await this.adminUsersService.update(input.id, input.data);
        }),

      // Primitive input — excluded from OpenAPI spec
      remove: this.trpc.adminProcedure.input(z.uuid()).mutation(async ({ input }) => {
        return await this.adminUsersService.remove(input);
      }),

      updatePassword: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/admin/users/password',
            tags: ['admin-users'],
            summary: 'Reset user password (admin)',
          },
        })
        .input(z.object({ id: z.uuid(), password: z.string() }))
        .output(z.unknown())
        .mutation(async ({ input }) => {
          return await this.adminUsersService.changePassword(input.id, input.password);
        }),
    });
  }
}
