import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { AuthService } from './services/auth.service';
import { RegisterSchema, LoginSchema } from '@ingexpert/schema';

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
  ) {}

  public get router() {
    return this.trpc.router({
      register: this.trpc.procedure.input(RegisterSchema).mutation(async ({ input }) => {
        return await this.authService.register(input);
      }),

      login: this.trpc.procedure.input(LoginSchema).mutation(async ({ input }) => {
        return await this.authService.login(input);
      }),
    });
  }
}
