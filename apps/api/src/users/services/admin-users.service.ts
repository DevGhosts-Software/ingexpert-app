import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@ingexpert/database';
import {
  CreateUserDto,
  CreateUserWithoutAuthDto,
  GrantAuthDto,
  UpdateUserDto,
  type UserEntity,
  type UserStats,
} from '@ingexpert/schema';

// Shape returned by queries that include staff → workArea
type UserWithStaff = Prisma.UserGetPayload<{
  include: { staff: { include: { workArea: true } } };
}>;

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

  // ── Mapper ──────────────────────────────────────────────────────────────────

  private mapUser(user: UserWithStaff): UserEntity {
    const { staff, ...rest } = user;
    return { ...rest, workArea: staff?.workArea?.name ?? null };
  }

  // ── WorkArea helper — find or create by name ─────────────────────────────

  private async upsertWorkArea(
    tx: Prisma.TransactionClient,
    name: string,
  ): Promise<{ id: string }> {
    return tx.workArea.upsert({
      where: { name },
      create: { name },
      update: {},
      select: { id: true },
    });
  }

  // ── Create with auth ────────────────────────────────────────────────────────

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      email_confirm: true,
      user_metadata: {
        nombre: createUserDto.name ?? 'Nuevo Usuario',
        rol: createUserDto.role ?? 'USER',
      },
    });

    if (error) {
      throw new InternalServerErrorException(`Error creating user in Supabase: ${error.message}`);
    }

    const userId = data.user.id;

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: createUserDto.email,
          name: createUserDto.name ?? null,
          role: createUserDto.role ?? 'USER',
          avatar: createUserDto.avatar ?? null,
          hasAuth: true,
        },
        update: {
          name: createUserDto.name ?? null,
          role: createUserDto.role ?? 'USER',
        },
      });

      if (createUserDto.workArea) {
        const wa = await this.upsertWorkArea(tx, createUserDto.workArea);
        await tx.staff.upsert({
          where: { id: userId },
          create: { id: userId, workAreaId: wa.id },
          update: { workAreaId: wa.id },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { staff: { include: { workArea: true } } },
      });
    });

    return this.mapUser(user);
  }

  // ── Create without auth ─────────────────────────────────────────────────────

  async createWithoutAuth(dto: CreateUserWithoutAuthDto): Promise<UserEntity> {
    const id = randomUUID();

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id,
          email: dto.email,
          name: dto.name ?? null,
          role: dto.role ?? 'USER',
          hasAuth: false,
        },
      });

      if (dto.workArea) {
        const wa = await this.upsertWorkArea(tx, dto.workArea);
        await tx.staff.create({ data: { id, workAreaId: wa.id } });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: { staff: { include: { workArea: true } } },
      });
    });

    return this.mapUser(user);
  }

  // ── Grant / Revoke auth ──────────────────────────────────────────────────────

  async grantAuth(dto: GrantAuthDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!existing) throw new NotFoundException(`Usuario con ID ${dto.id} no encontrado.`);
    if (existing.hasAuth) throw new BadRequestException(`El usuario ya tiene acceso al sistema.`);

    const { error } = await this.supabaseAdmin.auth.admin.createUser({
      id: dto.id,
      email: existing.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { nombre: existing.name ?? existing.email, rol: existing.role },
    });
    if (error)
      throw new InternalServerErrorException(`Error al crear acceso en Supabase: ${error.message}`);

    const user = await this.prisma.user.update({
      where: { id: dto.id },
      data: { hasAuth: true },
      include: { staff: { include: { workArea: true } } },
    });
    return this.mapUser(user);
  }

  async revokeAuth(id: string): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    if (!existing.hasAuth)
      throw new BadRequestException(`El usuario ya no tiene acceso al sistema.`);

    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(id);
    if (error)
      throw new InternalServerErrorException(
        `Error al revocar acceso en Supabase: ${error.message}`,
      );

    const user = await this.prisma.user.update({
      where: { id },
      data: { hasAuth: false },
      include: { staff: { include: { workArea: true } } },
    });
    return this.mapUser(user);
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats(): Promise<UserStats> {
    const [total, admins, withArea] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.staff.count({ where: { workAreaId: { not: null } } }),
    ]);
    return { total, admins, active: withArea, inactive: total - withArea };
  }

  async getWorkAreas(): Promise<string[]> {
    const rows = await this.prisma.workArea.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return rows.map((r) => r.name);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
      include: { staff: { include: { workArea: true } } },
    });
    return users.map((u) => this.mapUser(u));
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { staff: { include: { workArea: true } } },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return this.mapUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.findOne(id);

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: updateUserDto.name,
          avatar: updateUserDto.avatar,
          ...(updateUserDto.role !== undefined ? { role: updateUserDto.role } : {}),
        },
      });

      if (updateUserDto.workArea !== undefined) {
        if (updateUserDto.workArea) {
          const wa = await this.upsertWorkArea(tx, updateUserDto.workArea);
          await tx.staff.upsert({
            where: { id },
            create: { id, workAreaId: wa.id },
            update: { workAreaId: wa.id },
          });
        } else {
          await tx.staff.updateMany({ where: { id }, data: { workAreaId: null } });
        }
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: { staff: { include: { workArea: true } } },
      });
    });

    if (updateUserDto.name) {
      await this.supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { nombre: updateUserDto.name },
      });
    }

    return this.mapUser(user);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatar: true, hasAuth: true },
    });

    // Only call Supabase if the user has an auth account
    if (user?.hasAuth) {
      const { error } = await this.supabaseAdmin.auth.admin.deleteUser(id);
      if (error)
        throw new InternalServerErrorException(
          `Error deleting user from Supabase: ${error.message}`,
        );
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch {
      // Already deleted by cascade
    }

    if (user?.avatar) {
      const BUCKET = 'app-data';
      const marker = `/${BUCKET}/`;
      const idx = user.avatar.indexOf(marker);
      if (idx !== -1) {
        const path = user.avatar.slice(idx + marker.length);
        await this.supabaseAdmin.storage.from(BUCKET).remove([path]);
      }
    }

    return { success: true };
  }

  async changePassword(id: string, newPassword: string) {
    const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
    });
    if (error) throw new Error(`Error de Supabase: ${error.message}`);
    return data.user;
  }
}
