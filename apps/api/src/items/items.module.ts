import { Module } from '@nestjs/common';
import { TrpcModule } from '../trpc/trpc.module';
import { ItemsService } from './items.service';
import { ItemsRouter } from './items.router';

@Module({
    imports: [
        TrpcModule,
    ],
    controllers: [],
    providers: [
        ItemsService,
        ItemsRouter,
    ],
    exports: [
        ItemsRouter,
    ],
})
export class ItemsModule { }
