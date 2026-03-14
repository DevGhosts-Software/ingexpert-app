import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { ItemsRouter } from '../items/items.router';
import { MovementsRouter } from '../movements/movements.router';
import { KitsRouter } from '../kits/kits.router';
import { ProjectsRouter } from '../projects/projects.router';

@Injectable()
export class AppRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly itemsRouter: ItemsRouter,
    private readonly movementsRouter: MovementsRouter,
    private readonly kitsRouter: KitsRouter,
    private readonly projectsRouter: ProjectsRouter,
  ) {}

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
      items: this.itemsRouter.router,
      kits: this.kitsRouter.router,
      movements: this.movementsRouter.router,
      projects: this.projectsRouter.router,
    });
  }
}

export type AppRouterType = AppRouter['appRouter'];
