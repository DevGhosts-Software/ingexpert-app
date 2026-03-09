import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './trpc.context';
import { ZodError } from 'zod';
import { UserRole } from '@ingexpert/database';
import { type OpenApiMeta } from 'trpc-to-openapi';

type RouteDocsMeta = {
  docs?: {
    name?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    auth?: boolean;
    roles?: string[];
  };
};

type AppMeta = OpenApiMeta<RouteDocsMeta>;

@Injectable()
export class TrpcService {
  readonly t = initTRPC
    .context<Context>()
    .meta<AppMeta>()
    .create({
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

  readonly protectedProcedure = this.t.procedure
    .meta({ docs: { auth: true } })
    .use(async ({ ctx, next }) => {
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

  readonly adminProcedure = this.protectedProcedure
    .meta({ docs: { auth: true, roles: ['admin'] } })
    .use(async ({ ctx, next }) => {
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
