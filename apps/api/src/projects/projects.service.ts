import { Injectable } from '@nestjs/common';
import { Prisma } from '@ingexpert/database';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectEntity, ProjectPaginationInput } from '@ingexpert/schema';

const MANAGER_INCLUDE = {
  manager: { select: { name: true } },
} satisfies Prisma.ProjectInclude;

type ProjectWithManager = Prisma.ProjectGetPayload<{ include: typeof MANAGER_INCLUDE }>;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapProject(p: ProjectWithManager): ProjectEntity {
    return { ...p, manager: p.manager.name ?? null };
  }

  async findPaginated(input: ProjectPaginationInput) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { contact: { contains: input.search, mode: 'insensitive' } },
        { address: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = input.orderBy
      ? ({ [input.orderBy]: input.orderDir ?? 'asc' } as Prisma.ProjectOrderByWithRelationInput)
      : { name: 'asc' };

    const [total, data] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({ where, take: limit, skip, orderBy, include: MANAGER_INCLUDE }),
    ]);

    return {
      data: data.map((p) => this.mapProject(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAll(): Promise<ProjectEntity[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { name: 'asc' },
      include: MANAGER_INCLUDE,
    });
    return projects.map((p) => this.mapProject(p));
  }
}
