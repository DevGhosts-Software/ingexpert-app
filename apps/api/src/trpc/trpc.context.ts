import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ingexpert/database';

@Injectable()
export class TrpcContextService {
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase URL or Anon Key not configured');
    }

    this.supabase = createClient(supabaseUrl, anonKey);
  }

  createContext = async (opts: trpcExpress.CreateExpressContextOptions) => {
    const authHeader = opts.req.headers.authorization;
    let user: (User & { role?: UserRole }) | null = null;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const { data, error } = await this.supabase.auth.getUser(token);
          if (!error && data.user) {
            const dbUser = await this.prisma.user.findUnique({
              where: { id: data.user.id },
              select: { role: true },
            });
            user = {
              ...data.user,
              role: dbUser?.role,
            };
          }
        } catch {
          // Token invalid or expired
        }
      }
    }

    return {
      req: opts.req,
      res: opts.res,
      user,
    };
  };
}

export type Context = Awaited<ReturnType<TrpcContextService['createContext']>>;
