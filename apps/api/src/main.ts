import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppRouter } from './trpc/app.router';
import { TrpcContextService } from './trpc/trpc.context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors();

  const trpcContextService = app.get(TrpcContextService);
  const appRouter = app.get(AppRouter);

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter.appRouter,
      createContext: trpcContextService.createContext,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
}
bootstrap();
