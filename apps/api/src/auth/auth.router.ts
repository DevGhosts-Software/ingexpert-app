import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TrpcService } from '../trpc/trpc.service';
import { AuthService } from './services/auth.service';
import { LoginSchema } from '@ingexpert/schema';

const REFRESH_COOKIE = 'ingexpert_refresh_token';
const ACCESS_COOKIE = 'ingexpert_token';
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days (Supabase default)

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
  ) {}

  private cookieOptions(secure: boolean) {
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private accessMaxAge(expiresAt: number | undefined): number {
    return expiresAt
      ? (expiresAt - Math.floor(Date.now() / 1000)) * 1000
      : 60 * 60 * 1000; // default 1 hr
  }

  public get router() {
    return this.trpc.router({
      login: this.trpc.procedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
        const result = await this.authService.login(input);
        const opts = this.cookieOptions(process.env.NODE_ENV === 'production');
        ctx.res.cookie(ACCESS_COOKIE, result.access_token, {
          ...opts,
          maxAge: this.accessMaxAge(result.expires_at),
        });
        ctx.res.cookie(REFRESH_COOKIE, result.refresh_token, {
          ...opts,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
        return result;
      }),

      refresh: this.trpc.procedure.mutation(async ({ ctx }) => {
        const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE] as string | undefined;
        if (!refreshToken) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No refresh token' });
        }
        const result = await this.authService.refresh(refreshToken);
        const opts = this.cookieOptions(process.env.NODE_ENV === 'production');
        ctx.res.cookie(ACCESS_COOKIE, result.access_token, {
          ...opts,
          maxAge: this.accessMaxAge(result.expires_at),
        });
        ctx.res.cookie(REFRESH_COOKIE, result.refresh_token, {
          ...opts,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
        return result;
      }),

      logout: this.trpc.procedure.mutation(async ({ ctx }) => {
        ctx.res.clearCookie(ACCESS_COOKIE, { path: '/' });
        ctx.res.clearCookie(REFRESH_COOKIE, { path: '/' });
        return { success: true };
      }),
    });
  }
}
