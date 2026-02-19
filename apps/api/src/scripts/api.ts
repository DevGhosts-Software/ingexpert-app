// apps/api/src/scripts/api.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AppRouter } from '../trpc/app.router';
import { UserRole } from '@ingexpert/database';

async function main() {
    // Levanta la app Nest en memoria
    const app = await NestFactory.create(AppModule, { logger: false });
    const appRouter = app.get(AppRouter);

    // tRPC router raíz
    const router = appRouter.appRouter;

    // Creamos un "caller" que simula una request ya autenticada
    const caller = router.createCaller({
        req: {} as any,
        res: {} as any,
        user: {
            id: 'test-user-id',
            email: 'test@ingexpert.com',
            role: UserRole.ADMIN, // para poder usar adminProcedure
        },
    });

    // 1) Probar health
    const health = await caller.health();
    console.log('health:', health);

    // 2) Probar items.list
    const items = await caller.items.list();
    console.log('items.list:', items);

    // 3) Probar items.create
    const created = await caller.items.create({
        name: 'Taladro desde script',
        location: 'Almacén principal',
        stock: 10,
        unit: 'UNIDAD',
        type: 'TOOL',
        imageUrl: undefined,
    });
    console.log('items.create:', created);

    // 4) Probar items.upsertManyByName
    await caller.items.upsertManyByName([
        {
            name: 'Taladro desde script',
            location: 'Almacén secundario',
            stock: 20,
            unit: 'UNIDAD',
            type: 'TOOL',
            imageUrl: undefined,
        },
        {
            name: 'Nuevo Ítem Script',
            location: 'Depósito',
            stock: 5,
            unit: 'UNIDAD',
            type: 'PRODUCT',
            imageUrl: undefined,
        },
    ]);
    const itemsAfter = await caller.items.list();
    console.log('items.list (después de upsertManyByName):', itemsAfter);

    await app.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
