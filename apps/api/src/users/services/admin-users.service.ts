import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { type User, type Staff } from '@ingexpert/database';
import { CreateUserDto, UpdateUserDto, type UserEntity } from '@ingexpert/schema';

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

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
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

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
      include: { staff: true },
    });
    return users.map(this.mapUser);
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(user);
  }

  private mapUser(user: User & { staff: Staff | null }): UserEntity {
    const { staff, ...rest } = user;
    return { ...rest, workArea: staff?.workArea ?? null };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.findOne(id);

    // Update Prisma local data
    const user = await this.prisma.user.update({
      where: { id },
      data: { name: updateUserDto.name, avatar: updateUserDto.avatar },
      include: { staff: true },
    });

    // Optionally update Supabase metadata if name changed
    if (updateUserDto.name) {
      await this.supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          nombre: updateUserDto.name,
        },
      });
    }

    return this.mapUser(user);
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



  async changePassword(id: string, newPassword: string) {
    const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(
        id ,
        {password: newPassword}
    );

    if (error) {
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    return data.user;
  }
}
