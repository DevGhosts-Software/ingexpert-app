import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './trpc.context';
import { ZodError } from 'zod';
import { UserRole } from '@ingexpert/database';

@Injectable()
export class TrpcService {
  readonly t = initTRPC.context<Context>().create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

  readonly router = this.t.router;
  readonly procedure = this.t.procedure;
  readonly mergeRouters = this.t.mergeRouters;

  readonly protectedProcedure = this.t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      console.warn('Unauthorized access attempt: No user in context');
      ctx.res.clearCookie('ingexpert_token', { path: '/' });
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No active session or invalid token',
      });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

  readonly adminProcedure = this.protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user.role !== UserRole.ADMIN) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });
}
