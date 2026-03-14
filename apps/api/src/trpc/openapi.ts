import { generateOpenApiDocument } from 'trpc-to-openapi';
import type { AppRouterType } from './app.router';

export function createOpenApiDocument(appRouter: AppRouterType) {
  return generateOpenApiDocument(appRouter, {
    title: 'Ingexpert API',
    description: 'Corporate Stock Management System API',
    version: '0.1.0',
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    tags: ['auth', 'users', 'items', 'kits', 'movements', 'projects'],
  });
}
