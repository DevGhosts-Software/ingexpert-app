import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppRouter } from '../src/trpc/app.router';
import { createOpenApiDocument } from '../src/trpc/openapi';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const appRouter = app.get(AppRouter);
  const doc = createOpenApiDocument(appRouter.appRouter);

  const outputPath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));

  console.log(`✅ OpenAPI spec written to ${outputPath}`);
  await app.close();
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
