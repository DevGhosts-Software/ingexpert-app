import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@ingexpert/database';

export interface CreateUserDto {
  id: string;
  email: string;
  role?: UserRole;
  name?: string | null;
  avatar?: string | null;
  timezone?: string;
  locale?: string;
  preferredRetention?: number;
  darkMode?: boolean;
  metadata?: Record<string, any>;
}

export type UpdateUserDto = Partial<Omit<CreateUserDto, 'id'>>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(id: string, email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      return user;
    }

    const newUser = await this.prisma.user.create({
      data: {
        id,
        email,
      },
    });

    return newUser;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: createUserDto,
    });
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users;
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

  async update(id: string, updateUserDto: UpdateUserDto, currentVersion?: number): Promise<User> {
    if (currentVersion !== undefined) {
      // Optimistic Locking
      const result = await this.prisma.user.updateMany({
        where: {
          id,
          version: currentVersion,
        },
        data: {
          ...updateUserDto,
          version: { increment: 1 },
          lastSyncedAt: new Date(),
        },
      });

      if (result.count === 0) {
        const current = await this.prisma.user.findUnique({ where: { id } });
        if (!current) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        throw new ConflictException('Resource modified on another device. Please refresh.');
      }

      return this.findOne(id);
    }

    // Fallback: Standard update
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        version: { increment: 1 },
        lastSyncedAt: new Date(),
      },
    });
    return user;
  }

  async remove(id: string): Promise<User> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
    });
    return user;
  }
}
