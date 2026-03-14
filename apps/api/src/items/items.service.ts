import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Item, ItemType, Prisma } from '@ingexpert/database';
import { CreateItemDto, ItemEntity, ItemPaginationDto, UpdateItemDto } from '@ingexpert/schema';

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
    };
  }

  async findPaginated(input: ItemPaginationDto) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const skip = (page - 1) * limit;

    const conditions: Prisma.ItemWhereInput[] = [];

    // Type allowlist (multi-type) takes precedence over single-type filter
    if (input.filters?.types?.length) {
      conditions.push({ type: { in: input.filters.types } });
    } else if (input.filters?.type) {
      conditions.push({ type: input.filters.type as ItemType });
    }

    if (input.filters?.location) {
      conditions.push({ location: input.filters.location });
    }

    if (input.search) {
      conditions.push({
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { code: { contains: input.search, mode: 'insensitive' } },
          { location: { contains: input.search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ItemWhereInput = conditions.length > 0 ? { AND: conditions } : {};
    const orderBy = input.orderBy
      ? { [input.orderBy]: input.orderDir ?? 'asc' }
      : { id: 'desc' as const };

    const [total, data] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({ where, take: limit, skip, orderBy }),
    ]);

    return {
      data: data.map((item) => this.mapItem(item)),
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

  async findAll(): Promise<ItemEntity[]> {
    const items = await this.prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.mapItem(item));
  }
}
