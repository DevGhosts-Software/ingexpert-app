import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { AuthService } from './services/auth.service';
import { LoginSchema } from '@ingexpert/schema';

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
  ) {}

  public get router() {
    return this.trpc.router({
      login: this.trpc.procedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
        const result = await this.authService.login(input);
        ctx.res.cookie('token', result.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });
        return result;
      }),

      logout: this.trpc.procedure.mutation(async ({ ctx }) => {
        ctx.res.clearCookie('token', {
          path: '/',
        });
        return { success: true };
      }),
    });
  }
}
