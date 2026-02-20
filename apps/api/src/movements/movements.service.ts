// apps/api/src/movements/movements.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Movement, Prisma, MovementType } from '@ingexpert/database';
import { CreateMovementDto } from '@ingexpert/schema';

@Injectable()
export class MovementsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Obtiene todos los movimientos con sus detalles e ítems relacionados.
     */
    async findAll(): Promise<Movement[]> {
        return this.prisma.movement.findMany({
            orderBy: { date: 'desc' }, // Los más recientes primero
            include: {
                details: {
                    include: {
                        item: true, // Para poder ver qué ítem se movió
                    },
                },
                responsibleDelivery: true,
                responsibleReceipt: true,
                project: true,
            },
        });
    }

    /**
     * Crea un movimiento, sus detalles y actualiza el stock de los ítems en una sola transacción.
     */
    async create(createMovementDto: CreateMovementDto): Promise<Movement> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Crear el movimiento y sus detalles automáticamente (Nested Writes de Prisma)
            const movement = await tx.movement.create({
                data: {
                    type: createMovementDto.type,
                    personalName: createMovementDto.personalName,
                    destination: createMovementDto.destination,
                    responsibleDeliveryId: createMovementDto.responsibleDeliveryId,
                    responsibleReceiptId: createMovementDto.responsibleReceiptId,
                    date: new Date(), // Fecha actual del movimiento
                    projectId: createMovementDto.projectId,
                    // Esto crea los N registros en la tabla intermedia MovementDetail
                    details: {
                        create: createMovementDto.details.map((detail) => ({
                            itemId: detail.itemId,
                            quantity: new Prisma.Decimal(detail.quantity),
                        })),
                    },
                },
                include: {
                    details: true,
                },
            });

            // 2. Actualizar el stock de cada ítem involucrado
            for (const detail of createMovementDto.details) {
                const qty = new Prisma.Decimal(detail.quantity);

                await tx.item.update({
                    where: { id: detail.itemId },
                    data: {
                        // Operaciones atómicas de Prisma: incrementa o decrementa el stock de forma segura
                        stock:
                            createMovementDto.type === MovementType.ENTRY
                                ? { increment: qty }
                                : { decrement: qty },
                    },
                });
            }

            return movement;
        });
    }
}
