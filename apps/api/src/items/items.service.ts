import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Item, Prisma } from '@ingexpert/database';
import { CreateItemDto, UpdateItemDto } from '@ingexpert/schema';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    filters?: Record<string, any>;
  }) {
    const { page, limit, search, filters } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [],
    };

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          where.AND.push({ [key]: value });
        }
      });
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        take: limit,
        skip,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data: items,
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

  async create(createItemDto: CreateItemDto): Promise<Item> {
    return this.prisma.item.create({
      data: {
        name: createItemDto.name,
        code: createItemDto.code,
        location: createItemDto.location,
        stock: new Prisma.Decimal(createItemDto.stock),
        unit: createItemDto.unit,
        type: createItemDto.type,
        imageUrl: createItemDto.imageUrl ?? '',
      },
    });
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const { stock, ...rest } = updateItemDto;

    return this.prisma.item.update({
      where: { id },
      data: {
        ...rest,

        stock: stock !== undefined ? new Prisma.Decimal(stock) : undefined,
      },
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
        code: item.code,
        location: item.location,
        stock: new Prisma.Decimal(item.stock),
        unit: item.unit,
        type: item.type,
        imageUrl: item.imageUrl ?? '',
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
          code: item.code,
          location: item.location,
          stock: new Prisma.Decimal(item.stock),
          unit: item.unit,
          type: item.type,
          imageUrl: item.imageUrl ?? '',
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
