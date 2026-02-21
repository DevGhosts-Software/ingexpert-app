'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { UserStats, type UserStats as UserStatsType } from '@/features/users/components/user-stats';
import { UserTable } from '@/features/users/components/user-table';
import type { UserEntity } from '@ingexpert/schema';

function computeStats(users: UserEntity[]): UserStatsType {
  return {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    active: users.filter((u) => u.workArea !== null).length,
    inactive: users.filter((u) => u.workArea === null).length,
  };
}

export default function UsersPage() {
  const { data: users = [], isLoading } = trpc.adminUsers.list.useQuery();

  const stats = useMemo(() => computeStats(users), [users]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra las cuentas del sistema. Solo los administradores pueden crear y modificar
          usuarios.
        </p>
      </div>

      <UserStats stats={stats} />
      <UserTable users={users} isLoading={isLoading} />
    </div>
  );
}
