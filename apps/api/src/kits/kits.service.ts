import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetKitComponentsDto } from '@ingexpert/schema';

@Injectable()
export class KitsService {
    constructor(private readonly prisma: PrismaService) {}

    async getComponents(kitId: string) {
        return this.prisma.kitDetail.findMany({
            where: { kitId },
            include: {
                component: true,
            },
        });
    }

    async setComponents(data: SetKitComponentsDto) {
        const { kit_id, components } = data;

        return this.prisma.$transaction(async (tx) => {
            await tx.kitDetail.deleteMany({
                where: { kitId: kit_id },
            });

            if (components.length > 0) {
                await tx.kitDetail.createMany({
                    data: components.map((comp) => ({
                        kitId: kit_id,
                        componentId: comp.item_id,
                        quantity: comp.quantity,
                    })),
                });
            }

            return tx.kitDetail.findMany({
                where: { kitId: kit_id },
                include: { component: true },
            });
        });
    }

    async clearKit(kitId: string) {
        return this.prisma.kitDetail.deleteMany({
            where: { kitId },
        });
    }
}