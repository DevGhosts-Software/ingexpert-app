import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { ProjectsService } from './projects.service';
import {
  CreateProjectSchema,
  ProjectEntitySchema,
  ProjectListSchema,
  ProjectStatsSchema,
  UpdateProjectSchema,
  ProjectPaginationSchema,
} from '@ingexpert/schema';

@Injectable()
export class ProjectsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly projectsService: ProjectsService,
  ) {}

  public get router() {
    return this.trpc.router({
      list: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/projects',
            tags: ['projects'],
            summary: 'List projects (paginated)',
          },
        })
        .input(ProjectPaginationSchema)
        .output(ProjectListSchema)
        .query(async ({ input }) => {
          return this.projectsService.findPaginated(input);
        }),

      getAll: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/projects/all',
            tags: ['projects'],
            summary: 'Get all projects',
          },
        })
        .output(z.array(ProjectEntitySchema))
        .query(async () => {
          return this.projectsService.findAll();
        }),

      getStats: this.trpc.protectedProcedure
        .meta({
          openapi: {
            method: 'GET',
            path: '/projects/stats',
            tags: ['projects'],
            summary: 'Get project statistics',
          },
        })
        .output(ProjectStatsSchema)
        .query(async () => {
          return this.projectsService.getStats();
        }),

      create: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'POST',
            path: '/projects',
            tags: ['projects'],
            summary: 'Create project',
          },
        })
        .input(CreateProjectSchema)
        .output(ProjectEntitySchema)
        .mutation(async ({ input }) => {
          return this.projectsService.create(input);
        }),

      update: this.trpc.adminProcedure
        .meta({
          openapi: {
            method: 'PATCH',
            path: '/projects/{id}',
            tags: ['projects'],
            summary: 'Update project',
          },
        })
        .input(UpdateProjectSchema.extend({ id: z.string().uuid() }))
        .output(ProjectEntitySchema)
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return this.projectsService.update(id, data);
        }),

      // Primitive input — excluded from OpenAPI spec
      remove: this.trpc.adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
        return this.projectsService.remove(input);
      }),
    });
  }
}
