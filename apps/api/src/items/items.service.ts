import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Item, Prisma } from '@ingexpert/database';
import { CreateItemDto, UpdateItemDto } from '@ingexpert/schema';

@Injectable()
export class ItemsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Item[]> {
        return this.prisma.item.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async create(createItemDto: CreateItemDto): Promise<Item> {
        return this.prisma.item.create({
            data: {
                name: createItemDto.name,
                location: createItemDto.location,
                stock: new Prisma.Decimal(createItemDto.stock),
                unit: createItemDto.unit,
                type: createItemDto.type,
                image_url: createItemDto.imageUrl ?? '',
            },
        });
    }

    async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
        const data: Prisma.ItemUpdateInput = {};

        if (updateItemDto.name !== undefined) {
            data.name = updateItemDto.name;
        }

        if (updateItemDto.location !== undefined) {
            data.location = updateItemDto.location;
        }

        if (updateItemDto.unit !== undefined) {
            data.unit = updateItemDto.unit;
        }

        if (updateItemDto.type !== undefined) {
            data.type = updateItemDto.type;
        }

        if (updateItemDto.stock !== undefined) {
            data.stock = new Prisma.Decimal(updateItemDto.stock);
        }

        if (updateItemDto.imageUrl !== undefined) {
            data.image_url = updateItemDto.imageUrl;
        }

        return this.prisma.item.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Item> {
        return this.prisma.item.delete({
            where: { id },
        });
    }

    async createBatch(items: CreateItemDto[]): Promise<void> {
        await this.prisma.item.createMany({
            data: items.map((item) => ({
                name: item.name,
                location: item.location,
                stock: new Prisma.Decimal(item.stock),
                unit: item.unit,
                type: item.type,
                image_url: item.imageUrl ?? '',
            })),
        });
    }

    async upsertManyByName(items: CreateItemDto[]): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            for (const item of items) {

                const existing = await tx.item.findFirst({
                    where: { name: item.name },
                });

                const data = {
                    name: item.name,
                    location: item.location,
                    stock: new Prisma.Decimal(item.stock),
                    unit: item.unit,
                    type: item.type,
                    image_url: item.imageUrl ?? '',
                };

                if (existing) {

                    await tx.item.update({
                        where: { id: existing.id },
                        data,
                    });
                } else {

                    await tx.item.create({ data });
                }
            }
        });
    }
}