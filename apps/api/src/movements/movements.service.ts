import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '@ingexpert/database';
import {
  CreateMovementDto,
  MovementEntityWithDetails,
  MovementHeaderEntity,
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
        responsibleDelivery: { include: { user: { select: { name: true } } } };
        responsibleReceipt: { include: { user: { select: { name: true } } } };
      };
    }>,
  ): MovementEntityWithDetails {
    return {
      id: m.id,
      type: m.type,
      personalName: m.personalName,
      destination: m.destination,
      responsibleDeliveryId: m.responsibleDeliveryId,
      responsibleReceiptId: m.responsibleReceiptId,
      projectId: m.projectId,
      date: m.date.toISOString(),
      itemsCount: m.details.length,
      projectName: m.project?.name ?? null,
      responsibleDeliveryName: m.responsibleDelivery?.user?.name ?? null,
      responsibleReceiptName: m.responsibleReceipt?.user?.name ?? null,
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
      };
    }>,
  ): MovementHeaderEntity {
    return {
      id: m.id,
      type: m.type,
      personalName: m.personalName,
      destination: m.destination,
      responsibleDeliveryId: m.responsibleDeliveryId,
      responsibleReceiptId: m.responsibleReceiptId,
      projectId: m.projectId,
      date: m.date.toISOString(),
      itemsCount: m._count.details,
      projectName: m.project?.name ?? null,
    };
  }

  async findAll(): Promise<MovementHeaderEntity[]> {
    const movements = await this.prisma.movement.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { details: true } },
        project: { select: { name: true } },
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
        responsibleDelivery: { include: { user: { select: { name: true } } } },
        responsibleReceipt: { include: { user: { select: { name: true } } } },
      },
    });

    if (!movement) {
      throw new NotFoundException(`El movimiento con ID ${id} no existe.`);
    }

    return this.mapMovementWithDetails(movement);
  }

  async getStats(): Promise<MovementStats> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [total, entries, exits, thisMonth] = await Promise.all([
      this.prisma.movement.count(),
      this.prisma.movement.count({ where: { type: MovementType.ENTRY } }),
      this.prisma.movement.count({ where: { type: MovementType.EXIT } }),
      this.prisma.movement.count({ where: { date: { gte: firstOfMonth } } }),
    ]);

    return { total, entries, exits, thisMonth };
  }

  async getProjects() {
    return this.prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(input: CreateMovementDto): Promise<MovementEntityWithDetails> {
    const movement = await this.prisma.$transaction(async (tx) => {
      // 1. Obtener el stock actual de los ítems involucrados desde la BD
      const itemIds = input.details.map((d) => d.itemId);
      const itemsInDb = await tx.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true, stock: true },
      });
      const itemsMap = new Map(itemsInDb.map((item) => [item.id, item]));

      // 2. Agrupar las cantidades solicitadas por ítem
      const requiredQuantities = new Map<string, number>();
      for (const detail of input.details) {
        const current = requiredQuantities.get(detail.itemId) || 0;
        requiredQuantities.set(detail.itemId, current + detail.quantity);
      }

      // 3. Validar que los ítems existan y que haya stock suficiente para salidas (EXIT)
      for (const [itemId, totalRequired] of requiredQuantities.entries()) {
        const currentItem = itemsMap.get(itemId);
        if (!currentItem)
          throw new BadRequestException(`El ítem con ID ${itemId} no existe en la base de datos.`);

        if (input.type === MovementType.EXIT) {
          const currentStock = currentItem.stock.toNumber();
          if (currentStock < totalRequired) {
            throw new BadRequestException(
              `Stock insuficiente para el ítem "${currentItem.name}". Tienes ${currentStock} y solicitas ${totalRequired}.`,
            );
          }
        }
      }

      const created = await tx.movement.create({
        data: {
          type: input.type,
          personalName: input.personalName,
          destination: input.destination,
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
          responsibleDelivery: { include: { user: { select: { name: true } } } },
          responsibleReceipt: { include: { user: { select: { name: true } } } },
        },
      });

      const qtyOp = input.type === MovementType.ENTRY ? 'increment' : 'decrement';
      await Promise.all(
        input.details.map((d) =>
          tx.item.update({
            where: { id: d.itemId },
            data: { stock: { [qtyOp]: new Prisma.Decimal(d.quantity) } },
          }),
        ),
      );

      return created;
    });

    return this.mapMovementWithDetails(movement);
  }
}
