import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Item, ItemType, Prisma } from '@ingexpert/database';
import { CreateItemDto, ItemPaginationDto, UpdateItemDto } from '@ingexpert/schema';
import { paginatePrisma } from '../utils/paginatePrisma';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(input: ItemPaginationDto) {
    return paginatePrisma(this.prisma.item, input, ['name', 'code', 'location']);
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

  async getStats() {
    const LOW_STOCK_THRESHOLD = 10;
    const [total, products, equipment, tools, kits, lowStock] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.item.count({ where: { type: ItemType.PRODUCT } }),
      this.prisma.item.count({ where: { type: ItemType.EQUIPMENT } }),
      this.prisma.item.count({ where: { type: ItemType.TOOL } }),
      this.prisma.item.count({ where: { type: ItemType.KIT } }),
      this.prisma.item.count({
        where: { stock: { gt: 0, lt: LOW_STOCK_THRESHOLD } },
      }),
    ]);
    return { total, products, equipment, tools, kits, lowStock };
  }

  async getCounts(search?: string, location?: string) {
    const conditions: Prisma.ItemWhereInput[] = [];
    if (location) conditions.push({ location });
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const base: Prisma.ItemWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [all, products, equipment, tools, kits] = await Promise.all([
      this.prisma.item.count({ where: base }),
      this.prisma.item.count({ where: { ...base, type: ItemType.PRODUCT } }),
      this.prisma.item.count({ where: { ...base, type: ItemType.EQUIPMENT } }),
      this.prisma.item.count({ where: { ...base, type: ItemType.TOOL } }),
      this.prisma.item.count({ where: { ...base, type: ItemType.KIT } }),
    ]);
    return { ALL: all, PRODUCT: products, EQUIPMENT: equipment, TOOL: tools, KIT: kits };
  }

  async getLocations(): Promise<string[]> {
    const result = await this.prisma.item.findMany({
      select: { location: true },
      distinct: ['location'],
      orderBy: { location: 'asc' },
    });
    return result.map((r) => r.location);
  }
}
