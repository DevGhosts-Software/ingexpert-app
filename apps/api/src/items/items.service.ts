import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Item, ItemType, Prisma } from '@ingexpert/database';
import {
  CreateItemDto,
  ItemCounts,
  ItemEntity,
  ItemPaginationDto,
  ItemStats,
  UpdateItemDto,
} from '@ingexpert/schema';
import { paginatePrisma } from '../utils/paginatePrisma';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Maps a raw Prisma Item to the serializable ItemEntity (Decimal → number). */
  private mapItem(item: Item): ItemEntity {
    return {
      id: item.id,
      name: item.name,
      code: item.code,
      location: item.location,
      stock: item.stock.toNumber(),
      unit: item.unit,
      type: item.type,
      imageUrl: item.imageUrl,
      observations: item.observations ?? null,
    };
  }

  async findPaginated(input: ItemPaginationDto) {
    const result = await paginatePrisma<Item>(this.prisma.item, input, [
      'name',
      'code',
      'location',
    ]);
    return {
      data: result.data.map((item) => this.mapItem(item)),
      meta: result.meta,
    };
  }

  async create(createItemDto: CreateItemDto): Promise<ItemEntity> {
    const item = await this.prisma.item.create({
      data: {
        name: createItemDto.name,
        code: createItemDto.code,
        location: createItemDto.location,
        stock: new Prisma.Decimal(createItemDto.stock),
        unit: createItemDto.unit,
        type: createItemDto.type,
        imageUrl: createItemDto.imageUrl ?? '',
        observations: createItemDto.observations ?? null,
      },
    });
    return this.mapItem(item);
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<ItemEntity> {
    const { stock, ...rest } = updateItemDto;
    const item = await this.prisma.item.update({
      where: { id },
      data: {
        ...rest,
        stock: stock !== undefined ? new Prisma.Decimal(stock) : undefined,
      },
    });
    return this.mapItem(item);
  }

  async remove(id: string): Promise<ItemEntity> {
    const item = await this.prisma.item.delete({ where: { id } });
    return this.mapItem(item);
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
        observations: item.observations ?? null,
      })),
    });
  }

  async upsertManyByName(items: CreateItemDto[]): Promise<void> {
    const names = items.map((i) => i.name);

    // Single query to find all items that already exist by name
    const existing = await this.prisma.item.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    const existingMap = new Map(existing.map((e) => [e.name, e.id]));

    const mapData = (item: CreateItemDto) => ({
      name: item.name,
      code: item.code,
      location: item.location,
      stock: new Prisma.Decimal(item.stock),
      unit: item.unit,
      type: item.type,
      imageUrl: item.imageUrl ?? '',
      observations: item.observations ?? null,
    });

    const toCreate = items.filter((i) => !existingMap.has(i.name));
    const toUpdate = items.filter((i) => existingMap.has(i.name));

    // Batch-insert all new items in one query
    if (toCreate.length > 0) {
      await this.prisma.item.createMany({ data: toCreate.map(mapData) });
    }

    // Update existing items in parallel
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((item) =>
          this.prisma.item.update({
            where: { id: existingMap.get(item.name)! },
            data: mapData(item),
          }),
        ),
      );
    }
  }

  async getStats(): Promise<ItemStats> {
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

  async getCounts(search?: string, location?: string): Promise<ItemCounts> {
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

  async findAll(): Promise<ItemEntity[]> {
    const items = await this.prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.mapItem(item));
  }
}
