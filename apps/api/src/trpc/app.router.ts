import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { UsersRouter } from '../users/users.router';
import { AdminUsersRouter } from '../users/admin-users.router';
import { AuthRouter } from '../auth/auth.router';

@Injectable()
export class AppRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersRouter: UsersRouter,
    private readonly adminUsersRouter: AdminUsersRouter,
    private readonly authRouter: AuthRouter,
  ) {}

  public get appRouter() {
    return this.trpc.router({
      health: this.trpc.procedure.query(() => {
        return { status: 'ok', timestamp: new Date() };
      }),
      auth: this.authRouter.router,
      users: this.usersRouter.router,
      adminUsers: this.adminUsersRouter.router,
    });
  }
}

export type AppRouterType = AppRouter['appRouter'];
