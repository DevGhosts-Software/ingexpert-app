import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppRouter } from './trpc/app.router';
import { TrpcContextService } from './trpc/trpc.context';
import cookieParser from 'cookie-parser';
import { collectRoutes, generateDocsHtml } from 'trpc-docs-generator';
import { createOpenApiDocument } from './trpc/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://tauri.localhost', // Tauri webview on Windows
      'tauri://localhost', // Tauri webview on macOS/Linux
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

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

  // Expose OpenAPI JSON spec (always available for SDK generation)
  const openApiDocument = createOpenApiDocument(appRouter.appRouter);
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.get('/openapi.json', (_req: unknown, res: { json: (d: unknown) => void }) => {
    res.json(openApiDocument);
  });

  if (process.env.NODE_ENV !== 'production') {
    const routes = collectRoutes(appRouter.appRouter);
    const html = generateDocsHtml(routes, {
      title: 'IngExpert API',
    });

    expressInstance.get('/docs', (req: unknown, res: { send: (h: string) => void }) => {
      res.send(html);
    });

    console.log(`🚀 API Docs running on http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/trpc`);
}
bootstrap();
