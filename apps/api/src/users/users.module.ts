import { Module } from '@nestjs/common';
import { AdminUsersService } from './services/admin-users.service';
import { AdminUsersRouter } from './admin-users.router';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [TrpcModule],
  controllers: [],
  providers: [AdminUsersService, AdminUsersRouter],
  exports: [AdminUsersRouter],
})
export class UsersModule {}
