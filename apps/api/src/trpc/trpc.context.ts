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

    // Ensure no double slashes when joining URLs
    // Example: https://xyz.supabase.co + /auth/v1/...
    const sanitizedUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;

    this.client = jwksClient({
      jwksUri: `${sanitizedUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  // Arrow function to preserve 'this' context when passed to jwt.verify
  private getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        console.error('Error fetching signing key:', err.message);
        callback(err);
      } else {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      }
    });
  };

  createContext = async (opts: trpcExpress.CreateExpressContextOptions) => {
    // 1. Extraer Token
    const authHeader = opts.req.headers.authorization;
    let token = opts.req.cookies?.['ingexpert_token'];

    if (!token && authHeader) {
      // Formato "Bearer <token>"
      token = authHeader.split(' ')[1];
    }

    let user: { id: string; email?: string; role?: UserRole } | null = null;
    const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');

    if (token) {
      try {
        // 2. Decodificar sin verificar para saber qué algoritmo usa (HS256, RS256, ES256)
        const unverified = jwt.decode(token, { complete: true }) as any;
        const alg = unverified?.header?.alg;

        // 3. Verificar Token (Promisificado)
        const decoded: any = await new Promise((resolve, reject) => {
          // Decidimos qué estrategia usar según el algoritmo del header
          const strategy =
            alg === 'HS256' && jwtSecret
              ? jwtSecret // Estrategia Vieja (Secreto)
              : this.getKey; // Estrategia Nueva (JWKS)

          jwt.verify(token!, strategy, { algorithms: ['RS256', 'HS256', 'ES256'] }, (err, decodedToken) => {
            if (err) {
              console.error(`JWT Verification Error [${alg}]:`, err.message);
              return reject(err);
            }
            resolve(decodedToken);
          });
        });

        // 4. Buscar usuario en Base de Datos
        const userId = decoded.sub; // 'sub' es el ID de usuario en Supabase

        if (userId) {
          const dbUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
          });

          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role as UserRole,
            };
          } else {
            // Opcional: Si el usuario tiene token válido pero no está en DB local
            console.warn(`User ${userId} has valid token but not found in Prisma DB`);
          }
        }
      } catch (error: any) {
        // Token inválido, expirado o error de firma
        console.error('Context Auth Error:', error.message);
        // Dejamos user como null, no lanzamos error para permitir acceso a rutas públicas si las hubiera
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
