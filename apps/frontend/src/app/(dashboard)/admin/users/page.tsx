import { UserStats, type UserStats as UserStatsType } from '@/features/users/components/user-stats';
import { UserTable, type AppUser } from '@/features/users/components/user-table';

const mockUsers: AppUser[] = [
  {
    id: 'u-001',
    email: 'admin@ingexpert.com',
    name: 'Alejandro Castro',
    role: 'ADMIN',
    workArea: 'Gerencia',
  },
  {
    id: 'u-002',
    email: 'laura.torres@ingexpert.com',
    name: 'Laura Torres',
    role: 'ADMIN',
    workArea: 'Logística',
  },
  {
    id: 'u-003',
    email: 'carlos.mendez@ingexpert.com',
    name: 'Carlos Méndez',
    role: 'USER',
    workArea: 'Taller A',
  },
  {
    id: 'u-004',
    email: 'maria.gonzalez@ingexpert.com',
    name: 'María González',
    role: 'USER',
    workArea: 'Taller B',
  },
  {
    id: 'u-005',
    email: 'jorge.ramirez@ingexpert.com',
    name: 'Jorge Ramírez',
    role: 'USER',
    workArea: 'Almacén',
  },
  {
    id: 'u-006',
    email: 'sofia.herrera@ingexpert.com',
    name: 'Sofía Herrera',
    role: 'USER',
    workArea: 'Laboratorio',
  },
  {
    id: 'u-007',
    email: 'luis.fernandez@ingexpert.com',
    name: 'Luis Fernández',
    role: 'USER',
    workArea: 'Laboratorio',
  },
  {
    id: 'u-008',
    email: 'pedro.alvarez@ingexpert.com',
    name: 'Pedro Álvarez',
    role: 'USER',
  },
  {
    id: 'u-009',
    email: 'ana.castillo@ingexpert.com',
    name: 'Ana Castillo',
    role: 'USER',
    workArea: 'Logística',
  },
  {
    id: 'u-010',
    email: 'roberto.diaz@ingexpert.com',
    name: 'Roberto Díaz',
    role: 'USER',
  },
];

function computeStats(users: AppUser[]): UserStatsType {
  return {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    active: users.filter((u) => u.workArea).length,
    inactive: users.filter((u) => !u.workArea).length,
  };
}

export default function UsersPage() {
  const stats = computeStats(mockUsers);

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
      <UserTable users={mockUsers} />
    </div>
  );
}
