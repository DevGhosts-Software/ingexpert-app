import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { UsersService } from './services/users.service';
import { AdminUsersService } from './services/admin-users.service';
import { UpdateUserSchema } from '@ingexpert/schema';
import { z } from 'zod';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UsersService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  public get router() {
    return this.trpc.router({
      me: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/users/me',
            tags: ['users'],
            summary: 'Get current user',
          },
        })
        .output(z.unknown())
        .query(async ({ ctx }) => {
          return await this.usersService.findOrCreate(ctx.user.id, ctx.user.email!);
        }),

      updateMe: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'PATCH',
            path: '/users/me',
            tags: ['users'],
            summary: 'Update current user profile',
          },
        })
        .input(UpdateUserSchema)
        .output(z.unknown())
        .mutation(async ({ input, ctx }) => {
          return await this.usersService.update(ctx.user.id, input);
        }),

      updateMyPassword: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/users/me/password',
            tags: ['users'],
            summary: 'Change own password',
          },
        })
        .input(z.object({ password: z.string().min(8) }))
        .output(z.unknown())
        .mutation(async ({ input, ctx }) => {
          return await this.adminUsersService.changePassword(ctx.user.id, input.password);
        }),

      listNames: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/users/names',
            tags: ['users'],
            summary: 'List all user names',
          },
        })
        .output(z.unknown())
        .query(async () => {
          return await this.usersService
            .findAll()
            .then((users) => users.map((u) => ({ id: u.id, name: u.name, email: u.email })));
        }),
    });
  }
}
