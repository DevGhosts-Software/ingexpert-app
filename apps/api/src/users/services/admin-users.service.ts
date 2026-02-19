import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@ingexpert/database';
import { CreateUserDto, UpdateUserDto } from '@ingexpert/schema';

@Injectable()
export class AdminUsersService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase URL or Service Role Key not configured');
    }

    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async create(createUserDto: CreateUserDto & { password?: string }): Promise<any> {
    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password || 'Ingexpert2026!',
      email_confirm: true,
      user_metadata: {
        nombre: createUserDto.name || 'Nuevo Usuario',
        rol: createUserDto.role || 'USER',
      },
    });

    if (error) {
      throw new InternalServerErrorException(`Error creating user in Supabase: ${error.message}`);
    }

    // Note: We don't write to Prisma here. The SQL Trigger handles it.
    // However, we return the Supabase user data.
    return data.user;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { email: 'asc' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    // Update Prisma local data
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Optionally update Supabase metadata if role or name changed
    if (updateUserDto.role || updateUserDto.name) {
      await this.supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          nombre: updateUserDto.name,
          rol: updateUserDto.role,
        },
      });
    }

    return user;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    // 1. Delete from Supabase Auth
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      throw new InternalServerErrorException(`Error deleting user from Supabase: ${error.message}`);
    }

    // 2. Delete from Prisma (Cascade should handle it if configured, but let's be safe or explicit)
    // The user requested: "El borrado en cascada (si está configurado en SQL) borrará el usuario de public.USUARIO. Si no, borrar manualmente en Prisma"
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (e) {
      // Might already be deleted by cascade
    }

    return { success: true };
  }
}
