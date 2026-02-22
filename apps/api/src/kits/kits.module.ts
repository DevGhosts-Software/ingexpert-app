import { Module } from '@nestjs/common';
import { TrpcModule } from '../trpc/trpc.module';
import { KitsService } from './kits.service';
import { KitsRouter } from './kits.router';

@Module({
  imports: [TrpcModule],
  controllers: [],
  providers: [KitsService, KitsRouter],
  exports: [KitsRouter],
})
export class KitsModule {}
