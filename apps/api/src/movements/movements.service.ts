import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '@ingexpert/database';
import {
  CreateMovementDto,
  MovementEntityWithDetails,
  MovementHeaderEntity,
  MovementFiltersDto,
  MovementStats,
} from '@ingexpert/schema';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapMovementWithDetails(
    m: Prisma.MovementGetPayload<{
      include: {
        details: { include: { item: true } };
        project: { select: { name: true } };
        createdBy: { select: { name: true; email: true } };
        responsibleDelivery: { select: { name: true } };
        responsibleReceipt: { select: { name: true } };
      };
    }>,
  ): MovementEntityWithDetails {
    return {
      id: m.id,
      type: m.type,
      createdById: m.createdById,
      destination: m.destination,
      observations: m.observations,
      responsibleDeliveryId: m.responsibleDeliveryId,
      responsibleReceiptId: m.responsibleReceiptId,
      projectId: m.projectId,
      date: m.date.toISOString(),
      itemsCount: m.details.length,
      projectName: m.project?.name ?? null,
      creatorName: m.createdBy.name ?? m.createdBy.email,
      responsibleDeliveryName: m.responsibleDelivery?.name ?? null,
      responsibleReceiptName: m.responsibleReceipt?.name ?? null,
      details: m.details.map((d) => ({
        id: d.id,
        movementId: d.movementId,
        itemId: d.itemId,
        quantity: d.quantity.toNumber(),
        item: {
          ...d.item,
          stock: d.item.stock.toNumber(),
        },
      })),
    };
  }

  private mapMovementHeader(
    m: Prisma.MovementGetPayload<{
      include: {
        _count: { select: { details: true } };
        project: { select: { name: true } };
        createdBy: { select: { name: true; email: true } };
        responsibleDelivery: { select: { name: true } };
        responsibleReceipt: { select: { name: true } };
      };
    }>,
  ): MovementHeaderEntity {
    return {
      id: m.id,
      type: m.type,
      createdById: m.createdById,
      destination: m.destination,
      observations: m.observations,
      responsibleDeliveryId: m.responsibleDeliveryId,
      responsibleReceiptId: m.responsibleReceiptId,
      projectId: m.projectId,
      date: m.date.toISOString(),
      itemsCount: m._count.details,
      projectName: m.project?.name ?? null,
      creatorName: m.createdBy.name ?? m.createdBy.email,
      responsibleDeliveryName: m.responsibleDelivery?.name ?? null,
      responsibleReceiptName: m.responsibleReceipt?.name ?? null,
    };
  }

  async findAll(filters?: MovementFiltersDto): Promise<MovementHeaderEntity[]> {
    const where: Prisma.MovementWhereInput = {};

    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const movements = await this.prisma.movement.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { details: true } },
        project: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        responsibleDelivery: { select: { name: true } },
        responsibleReceipt: { select: { name: true } },
      },
    });
    return movements.map((m) => this.mapMovementHeader(m));
  }

  async findOne(id: string): Promise<MovementEntityWithDetails> {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
      include: {
        details: { include: { item: true } },
        project: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        responsibleDelivery: { select: { name: true } },
        responsibleReceipt: { select: { name: true } },
      },
    });

    if (!movement) {
      throw new NotFoundException(`El movimiento con ID ${id} no existe.`);
    }

    return this.mapMovementWithDetails(movement);
  }

  async getStats(filters?: MovementFiltersDto): Promise<MovementStats> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const baseWhere: Prisma.MovementWhereInput = {};
    if (filters?.createdById) baseWhere.createdById = filters.createdById;
    if (filters?.dateFrom || filters?.dateTo) {
      baseWhere.date = {};
      if (filters.dateFrom)
        (baseWhere.date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setUTCHours(23, 59, 59, 999);
        (baseWhere.date as Prisma.DateTimeFilter).lte = end;
      }
    }

    const [total, purchases, returns, exits, writeoffs, thisMonth] = await Promise.all([
      this.prisma.movement.count({ where: baseWhere }),
      this.prisma.movement.count({ where: { ...baseWhere, type: MovementType.PURCHASE } }),
      this.prisma.movement.count({ where: { ...baseWhere, type: MovementType.RETURN } }),
      this.prisma.movement.count({ where: { ...baseWhere, type: MovementType.EXIT } }),
      this.prisma.movement.count({ where: { ...baseWhere, type: MovementType.WRITEOFF } }),
      this.prisma.movement.count({ where: { ...baseWhere, date: { gte: firstOfMonth } } }),
    ]);

    return { total, purchases, returns, exits, writeoffs, thisMonth };
  }

  async getProjects() {
    return this.prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(input: CreateMovementDto, createdById: string): Promise<MovementEntityWithDetails> {
    const movement = await this.prisma.movement.create({
      data: {
        type: input.type,
        createdById,
        destination: input.destination,
        observations: input.observations,
        responsibleDeliveryId: input.responsibleDeliveryId,
        responsibleReceiptId: input.responsibleReceiptId,
        projectId: input.projectId,
        date: new Date(),
        details: {
          create: input.details.map((d) => ({
            itemId: d.itemId,
            quantity: new Prisma.Decimal(d.quantity),
          })),
        },
      },
      include: {
        details: { include: { item: true } },
        project: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        responsibleDelivery: { select: { name: true } },
        responsibleReceipt: { select: { name: true } },
      },
    });

    return this.mapMovementWithDetails(movement);
  }
}
