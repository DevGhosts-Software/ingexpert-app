import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { UsersRouter } from '../users/users.router';
import { AdminUsersRouter } from '../users/admin-users.router';
import { AuthRouter } from '../auth/auth.router';
import { ItemsRouter } from '../items/items.router';
import { MovementsRouter } from '../movements/movements.router';

@Injectable()
export class AppRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersRouter: UsersRouter,
    private readonly adminUsersRouter: AdminUsersRouter,
    private readonly authRouter: AuthRouter,
    private readonly itemsRouter: ItemsRouter,
    private readonly movementsRouter: MovementsRouter,
  ) { }

  public get appRouter() {
    return this.trpc.router({
      health: this.trpc.procedure.query(() => {
        return { status: 'ok', timestamp: new Date() };
      }),
      debug: this.trpc.procedure.query(({ ctx }) => {
        return {
          cookies: ctx.req.cookies,
          headers: ctx.req.headers,
        };
      }),
      auth: this.authRouter.router,
      users: this.usersRouter.router,
      adminUsers: this.adminUsersRouter.router,
      items: this.itemsRouter.router,
      movements: this.movementsRouter.router,
    });
  }
}

export type AppRouterType = AppRouter['appRouter'];
