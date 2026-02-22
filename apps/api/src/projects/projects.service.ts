import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginatePrisma } from '../utils/paginatePrisma';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectEntity,
  ProjectPaginationInput,
} from '@ingexpert/schema';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(input: ProjectPaginationInput) {
    return paginatePrisma<ProjectEntity>(this.prisma.project, input, [
      'name',
      'contact',
      'address',
      'manager',
    ]);
  }

  async findAll(): Promise<ProjectEntity[]> {
    return this.prisma.project.findMany({ orderBy: { name: 'asc' } });
  }

  async create(input: CreateProjectDto): Promise<ProjectEntity> {
    return this.prisma.project.create({ data: input });
  }

  async update(id: string, input: UpdateProjectDto): Promise<ProjectEntity> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`El proyecto con ID ${id} no existe.`);
    return this.prisma.project.update({ where: { id }, data: input });
  }

  async remove(id: string): Promise<{ id: string }> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`El proyecto con ID ${id} no existe.`);
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }
}
