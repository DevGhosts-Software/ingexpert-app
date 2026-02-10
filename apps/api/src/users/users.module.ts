import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { AdminUsersService } from './services/admin-users.service';
import { UsersRouter } from './users.router';
import { AdminUsersRouter } from './admin-users.router';
import { TrpcModule } from '../trpc/trpc.module';

@Module({
  imports: [TrpcModule],
  controllers: [],
  providers: [UsersService, AdminUsersService, UsersRouter, AdminUsersRouter],
  exports: [UsersRouter, AdminUsersRouter],
})
export class UsersModule {}
