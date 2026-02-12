import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../api/src/trpc/app.router';

export type AppRouterType = AppRouter['appRouter'];

export const trpc = createTRPCReact<AppRouterType>();
