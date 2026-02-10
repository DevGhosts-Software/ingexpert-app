import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { UsersService } from './services/users.service';
import { UpdateUserSchema } from '@ingexpert/schema';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UsersService,
  ) {}

  public get router() {
    return this.trpc.router({
      me: this.trpc.protectedProcedure.query(async ({ ctx }) => {
        return await this.usersService.findOrCreate(ctx.user.id, ctx.user.email!);
      }),

      updateMe: this.trpc.protectedProcedure
        .input(UpdateUserSchema)
        .mutation(async ({ input, ctx }) => {
          return await this.usersService.update(ctx.user.id, input);
        }),

      removeMe: this.trpc.protectedProcedure.mutation(async ({ ctx }) => {
        return await this.usersService.remove(ctx.user.id);
      }),
    });
  }
}
