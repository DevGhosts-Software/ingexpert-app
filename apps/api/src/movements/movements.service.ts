import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '@ingexpert/database';
import {
  CreateMovementDto,
  UpdateMovementDto,
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

  async update(id: string, input: UpdateMovementDto): Promise<MovementEntityWithDetails> {
    const movement = await this.prisma.$transaction(async (tx) => {
      // 1. Load original movement to reverse its stock effects
      const original = await tx.movement.findUnique({
        where: { id },
        include: { details: { select: { itemId: true, quantity: true } } },
      });
      if (!original) throw new NotFoundException(`El movimiento con ID ${id} no existe.`);

      // 2. Validate new items exist and check stock for EXIT
      const newItemIds = input.details.map((d) => d.itemId);
      const itemsInDb = await tx.item.findMany({
        where: { id: { in: newItemIds } },
        select: { id: true, name: true, stock: true },
      });
      const itemsMap = new Map(itemsInDb.map((i) => [i.id, i]));

      const newQuantities = new Map<string, number>();
      for (const d of input.details) {
        newQuantities.set(d.itemId, (newQuantities.get(d.itemId) ?? 0) + d.quantity);
      }

      if (input.type === MovementType.EXIT || input.type === MovementType.WRITEOFF) {
        const originalQuantities = new Map<string, number>();
        const originalDeductsStock =
          original.type === MovementType.EXIT || original.type === MovementType.WRITEOFF;
        for (const d of original.details) {
          originalQuantities.set(
            d.itemId,
            (originalQuantities.get(d.itemId) ?? 0) + d.quantity.toNumber(),
          );
        }
        for (const [itemId, needed] of newQuantities.entries()) {
          const item = itemsMap.get(itemId);
          if (!item) throw new BadRequestException(`El ítem con ID ${itemId} no existe.`);
          const currentStock = item.stock.toNumber();
          const originalQty = originalQuantities.get(itemId) ?? 0;
          const stockAfterReverse = originalDeductsStock
            ? currentStock + originalQty
            : currentStock - originalQty;
          if (stockAfterReverse < needed) {
            throw new BadRequestException(
              `Stock insuficiente para "${item.name}". Disponible: ${stockAfterReverse}, solicitado: ${needed}.`,
            );
          }
        }
      }

      // 3. Reverse original stock changes
      const reverseOp =
        original.type === MovementType.EXIT || original.type === MovementType.WRITEOFF
          ? 'increment'
          : 'decrement';
      await Promise.all(
        original.details.map((d) =>
          tx.item.update({
            where: { id: d.itemId },
            data: { stock: { [reverseOp]: d.quantity } },
          }),
        ),
      );

      // 4. Delete old details and update movement
      await tx.movementDetail.deleteMany({ where: { movementId: id } });

      const updated = await tx.movement.update({
        where: { id },
        data: {
          type: input.type,
          destination: input.destination ?? null,
          observations: input.observations ?? null,
          responsibleDeliveryId: input.responsibleDeliveryId ?? null,
          responsibleReceiptId: input.responsibleReceiptId ?? null,
          projectId: input.projectId ?? null,
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

      // 5. Apply new stock changes
      const applyOp =
        input.type === MovementType.PURCHASE || input.type === MovementType.RETURN
          ? 'increment'
          : 'decrement';
      await Promise.all(
        input.details.map((d) =>
          tx.item.update({
            where: { id: d.itemId },
            data: { stock: { [applyOp]: new Prisma.Decimal(d.quantity) } },
          }),
        ),
      );

      return updated;
    });

    return this.mapMovementWithDetails(movement);
  }

  async create(input: CreateMovementDto, createdById: string): Promise<MovementEntityWithDetails> {
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

        if (input.type === MovementType.EXIT || input.type === MovementType.WRITEOFF) {
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

      const qtyOp =
        input.type === MovementType.PURCHASE || input.type === MovementType.RETURN
          ? 'increment'
          : 'decrement';
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
