import { Injectable } from '@nestjs/common';
import { ItemType } from '@ingexpert/database';
import { PrismaService } from '../prisma/prisma.service';
import { KitImportRow } from '@ingexpert/schema';

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

  async importMany(rows: KitImportRow[]): Promise<void> {
    if (rows.length === 0) return;

    // Group rows by kitCode
    const kitMap = new Map<
      string,
      { name: string; components: { code: string; name: string; quantity: number }[] }
    >();
    for (const row of rows) {
      if (!kitMap.has(row.kitCode)) {
        kitMap.set(row.kitCode, { name: row.kitName, components: [] });
      }
      kitMap.get(row.kitCode)!.components.push({
        code: row.componentCode,
        name: row.componentName,
        quantity: row.quantity,
      });
    }

    const kitCodes = [...kitMap.keys()];
    const componentCodes = [...new Set(rows.map((r) => r.componentCode))];

    const [existingKits, existingComponents] = await Promise.all([
      this.prisma.item.findMany({
        where: { code: { in: kitCodes }, type: ItemType.KIT },
        select: { id: true, code: true },
      }),
      this.prisma.item.findMany({
        where: { code: { in: componentCodes } },
        select: { id: true, code: true },
      }),
    ]);

    const kitIdByCode = new Map(existingKits.map((k) => [k.code, k.id]));
    const componentIdByCode = new Map(existingComponents.map((c) => [c.code, c.id]));

    await this.prisma.$transaction(async (tx) => {
      for (const [kitCode, kitData] of kitMap.entries()) {
        let kitId = kitIdByCode.get(kitCode);

        if (!kitId) {
          const created = await tx.item.create({
            data: {
              code: kitCode,
              name: kitData.name,
              type: ItemType.KIT,
              location: '-',
              stock: 0,
              unit: 'kit',
              imageUrl: '',
            },
          });
          kitId = created.id;
        }

        // Replace kit components entirely with the imported set
        await tx.kitDetail.deleteMany({ where: { kitId } });

        const validComponents = kitData.components
          .map((c) => ({ componentId: componentIdByCode.get(c.code), quantity: c.quantity }))
          .filter(
            (c): c is { componentId: string; quantity: number } => c.componentId !== undefined,
          );

        if (validComponents.length > 0) {
          await tx.kitDetail.createMany({
            data: validComponents.map((c) => ({
              kitId: kitId!,
              componentId: c.componentId,
              quantity: c.quantity,
            })),
          });
        }
      }
    });
  }
}
