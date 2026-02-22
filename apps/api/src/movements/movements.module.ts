import { Module } from '@nestjs/common';
import { TrpcModule } from '../trpc/trpc.module';
import { MovementsService } from './movements.service';
import { MovementsRouter } from './movements.router';

@Module({
  imports: [TrpcModule],
  controllers: [],
  providers: [MovementsService, MovementsRouter],
  exports: [MovementsRouter],
})
export class MovementsModule {}
