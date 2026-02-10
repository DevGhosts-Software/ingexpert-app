import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TrpcService } from './trpc.service';
import { TrpcContextService } from './trpc.context';

@Module({
  imports: [ConfigModule],
  providers: [TrpcService, TrpcContextService],
  exports: [TrpcService, TrpcContextService],
})
export class TrpcModule {}
