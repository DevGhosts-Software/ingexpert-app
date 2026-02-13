import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as trpcExpress from '@trpc/server/adapters/express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ingexpert/database';

@Injectable()
export class TrpcContextService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  createContext = async (opts: trpcExpress.CreateExpressContextOptions) => {
    const authHeader = opts.req.headers.authorization;
    let token = opts.req.cookies?.['token'];

    if (!token && authHeader) {
      token = authHeader.split(' ')[1];
    }

    let user: { id: string; email?: string; role?: UserRole } | null = null;

    if (token) {
      try {
        const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
        if (!secret) {
          throw new Error('SUPABASE_JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, secret) as any;
        const userId = decoded.sub;

        if (userId) {
          const dbUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
          });

          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
            };
          }
        }
      } catch (error) {
        // Token invalid or expired
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
