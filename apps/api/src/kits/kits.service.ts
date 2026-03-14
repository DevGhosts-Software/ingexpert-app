import { Injectable } from '@nestjs/common';
import { ItemType } from '@ingexpert/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWithComponents() {
    const kits = await this.prisma.item.findMany({
      where: { type: ItemType.KIT },
      orderBy: { name: 'asc' },
      include: {
        kitDetails: {
          include: { component: true },
        },
      },
    });
    return kits.map((kit) => ({
      id: kit.id,
      code: kit.code,
      name: kit.name,
      components: kit.kitDetails.map((kd) => ({
        name: kd.component.name,
        code: kd.component.code,
        quantity: kd.quantity.toNumber(),
        unit: kd.component.unit,
      })),
    }));
  }
}
