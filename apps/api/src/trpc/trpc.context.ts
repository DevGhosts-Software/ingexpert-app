import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as trpcExpress from '@trpc/server/adapters/express';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ingexpert/database';

@Injectable()
export class TrpcContextService {
  private client: jwksClient.JwksClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    this.client = jwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  private getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
      } else {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      }
    });
  };

  createContext = async (opts: trpcExpress.CreateExpressContextOptions) => {
    const authHeader = opts.req.headers.authorization;
    let token = opts.req.cookies?.['token'];

    if (!token && authHeader) {
      token = authHeader.split(' ')[1];
    }

    let user: { id: string; email?: string; role?: UserRole } | null = null;

    if (token) {
      try {
        const decoded = await new Promise<any>((resolve, reject) => {
          jwt.verify(
            token,
            this.getKey,
            { algorithms: ['RS256'] },
            (err, decoded) => {
              if (err) return reject(err);
              resolve(decoded);
            },
          );
        });

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
