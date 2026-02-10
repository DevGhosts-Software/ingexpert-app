import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthRouter } from './auth.router';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [TrpcModule],
  controllers: [],
  providers: [AuthService, AuthRouter],
  exports: [AuthService, AuthRouter],
})
export class AuthModule {}
