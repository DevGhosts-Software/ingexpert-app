import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@ingexpert/database';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '@ingexpert/schema';

@Injectable()
export class AuthService {
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Ensure local user exists (lazy sync / auto-healing)
    if (data.user) {
      await this.prisma.user.upsert({
        where: { id: data.user.id },
        update: {}, // If exists, don't update (handled by trigger or admin)
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: (data.user.user_metadata.nombre as string) || 'Usuario Sin Nombre',
          role: (data.user.user_metadata.rol as UserRole) || UserRole.USER,
        },
      });
    }

    return {
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: data.user,
    };
  }
}
