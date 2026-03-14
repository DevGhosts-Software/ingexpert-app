import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { ProjectsService } from './projects.service';
import { ProjectEntitySchema, ProjectListSchema, ProjectPaginationSchema } from '@ingexpert/schema';

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
    });
  }
}
