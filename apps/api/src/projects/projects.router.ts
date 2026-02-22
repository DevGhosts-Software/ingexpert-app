import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../trpc/trpc.service';
import { ProjectsService } from './projects.service';
import {
  CreateProjectSchema,
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
      list: this.trpc.protectedProcedure.input(ProjectPaginationSchema).query(async ({ input }) => {
        return this.projectsService.findPaginated(input);
      }),

      getAll: this.trpc.protectedProcedure.query(async () => {
        return this.projectsService.findAll();
      }),

      getStats: this.trpc.protectedProcedure.query(async () => {
        return this.projectsService.getStats();
      }),

      create: this.trpc.adminProcedure.input(CreateProjectSchema).mutation(async ({ input }) => {
        return this.projectsService.create(input);
      }),

      update: this.trpc.adminProcedure
        .input(UpdateProjectSchema.extend({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return this.projectsService.update(id, data);
        }),

      remove: this.trpc.adminProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
        return this.projectsService.remove(input);
      }),
    });
  }
}
