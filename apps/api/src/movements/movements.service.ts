import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MovementType } from '@ingexpert/database';
import { CreateMovementDto, MovementEntityWithDetails, MovementHeaderEntity } from '@ingexpert/schema';

@Injectable()
export class MovementsService {
    constructor(private readonly prisma: PrismaService) { }

    private mapMovementWithDetails(
        m: Prisma.MovementGetPayload<{ include: { details: { include: { item: true } } } }>
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
            details: m.details.map((d) => ({
                id: d.id,
                movementId: d.movementId,
                itemId: d.itemId,
                quantity: d.quantity.toNumber(),
                item: {
                    ...d.item,
                    stock: d.item.stock.toNumber(),
                }
            })),
        };
    }

    private mapMovementHeader(
        m: Prisma.MovementGetPayload<{ include: { _count: { select: { details: true } } } }>
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
        };
    }

    async findAll(): Promise<MovementHeaderEntity[]> {
        const movements = await this.prisma.movement.findMany({
            orderBy: { date: 'desc' },
            include: { _count: { select: { details: true } } },
        });
        return movements.map((m) => this.mapMovementHeader(m));
    }

    async findOne(id: string): Promise<MovementEntityWithDetails> {
        const movement = await this.prisma.movement.findUnique({
            where: { id },
            include: { details: { include: { item: true } } },
        });

        if (!movement) {
            throw new NotFoundException(`El movimiento con ID ${id} no existe.`);
        }

        return this.mapMovementWithDetails(movement);
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
            // (Previene bugs si el frontend envía el mismo ID varias veces en el array)
            const requiredQuantities = new Map<string, number>();
            for (const detail of input.details) {
                const current = requiredQuantities.get(detail.itemId) || 0;
                requiredQuantities.set(detail.itemId, current + detail.quantity);
            }

            // 3. Validar que los ítems existan y que haya stock suficiente para salidas (EXIT)
            for (const [itemId, totalRequired] of requiredQuantities.entries()) {
                const currentItem = itemsMap.get(itemId);
                if (!currentItem) throw new BadRequestException(`El ítem con ID ${itemId} no existe en la base de datos.`);

                if (input.type === MovementType.EXIT) {
                    const currentStock = currentItem.stock.toNumber();
                    if (currentStock < totalRequired) {
                        throw new BadRequestException(`Stock insuficiente para el ítem "${currentItem.name}". Tienes ${currentStock} y solicitas ${totalRequired}.`);
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
                include: { details: { include: { item: true } } },
            });

            const qtyOp = input.type === MovementType.ENTRY ? 'increment' : 'decrement';
            await Promise.all(
                input.details.map((d) =>
                    tx.item.update({
                        where: { id: d.itemId },
                        data: { stock: { [qtyOp]: new Prisma.Decimal(d.quantity) } },
                    })
                )
            );

            return created;
        });

        return this.mapMovementWithDetails(movement);
    }
}
