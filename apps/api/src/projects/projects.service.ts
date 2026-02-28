import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ingexpert/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectEntity,
  ProjectPaginationInput,
} from '@ingexpert/schema';

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

  async getStats(): Promise<{ total: number }> {
    const total = await this.prisma.project.count();
    return { total };
  }

  async create(input: CreateProjectDto): Promise<ProjectEntity> {
    const project = await this.prisma.project.create({ data: input, include: MANAGER_INCLUDE });
    return this.mapProject(project);
  }

  async update(id: string, input: UpdateProjectDto): Promise<ProjectEntity> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`El proyecto con ID ${id} no existe.`);
    const project = await this.prisma.project.update({
      where: { id },
      data: input,
      include: MANAGER_INCLUDE,
    });
    return this.mapProject(project);
  }

  async remove(id: string): Promise<{ id: string }> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`El proyecto con ID ${id} no existe.`);

    const movementCount = await this.prisma.movement.count({ where: { projectId: id } });
    if (movementCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar "${existing.name}": tiene ${movementCount} movimiento${movementCount > 1 ? 's' : ''} asociado${movementCount > 1 ? 's' : ''}.`,
      );
    }

    await this.prisma.project.delete({ where: { id } });
    return { id };
  }
}
