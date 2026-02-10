import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';

// Define local types matching the router schemas
export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

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

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // 1. Sign up with Supabase
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.user) {
      throw new InternalServerErrorException('User creation failed in Supabase');
    }

    // 2. Sync to Prisma (Public User Table)
    // Note: If email confirmation is on, the user might not be able to login yet.
    // But we can still create the profile.
    // We should check if user already exists in Prisma to avoid unique constraint error
    // (though Supabase check should catch it, there might be edge cases).

    const existingUser = await this.prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!existingUser) {
      try {
        await this.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            // Default values are handled by DB or DTO defaults,
            // but here we are writing directly to DB.
          },
        });
      } catch (dbError: unknown) {
        // Rollback? We can't easily rollback Supabase auth user creation from here without Admin API.
        // But this is a critical sync step.
        console.error('Failed to create local user:', dbError);
        // In a real production app, we might use a queue or atomic transaction if possible (distributed).
        // For now, allow manual retry or ignore if it exists.
        throw new InternalServerErrorException('Failed to synchronize user profile');
      }
    }

    return {
      message: 'User registered successfully',
      user: data.user,
      session: data.session, // Session might be null if email confirmation is required
    };
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

    // Ensure local user exists (lazy sync)
    if (data.user) {
      const user = await this.prisma.user.findUnique({ where: { id: data.user.id } });
      if (!user) {
        await this.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
          },
        });
      }
    }

    return {
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: data.user,
    };
  }
}
