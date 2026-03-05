'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeftRight,
  Boxes,
  Container,
  FolderKanban,
  LayoutGrid,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  warning,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
  warning?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${warning ? 'text-amber-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div
            className={`text-2xl font-bold ${warning && value && value > 0 ? 'text-amber-600' : ''}`}
          >
            {value ?? '—'}
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: me } = trpc.users.me.useQuery();
  const isAdmin = me?.role === 'ADMIN';

  const { data: itemStats, isLoading: loadingItems } = trpc.items.getStats.useQuery();
  const { data: movStats, isLoading: loadingMov } = trpc.movements.getStats.useQuery();
  const { data: projStats, isLoading: loadingProj } = trpc.projects.getStats.useQuery();
  const { data: userStats, isLoading: loadingUsers } = trpc.adminUsers.getStats.useQuery(
    undefined,
    { enabled: isAdmin },
  );

  const displayName = me?.name ?? me?.email ?? '…';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel Principal</h2>
        <p className="text-muted-foreground">Resumen general del sistema de inventario.</p>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Ítems"
          value={itemStats?.total}
          icon={Package}
          loading={loadingItems}
        />
        <StatCard
          title="Movimientos este mes"
          value={movStats?.thisMonth}
          icon={ArrowLeftRight}
          description={movStats ? `${movStats.total} en total` : undefined}
          loading={loadingMov}
        />
        <StatCard
          title="Proyectos"
          value={projStats?.total}
          icon={FolderKanban}
          description="proyectos registrados"
          loading={loadingProj}
        />
        {isAdmin ? (
          <StatCard
            title="Usuarios"
            value={userStats?.total}
            icon={Users}
            description={userStats ? `${userStats.admins} administradores` : undefined}
            loading={loadingUsers}
          />
        ) : (
          <Card className="flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground text-center">
              Bienvenido, <span className="font-medium text-foreground">{displayName}</span>
            </p>
          </Card>
        )}
      </div>

      {/* Detail row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Inventario breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Desglose de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingItems ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Boxes className="h-3.5 w-3.5" /> Productos
                  </span>
                  <span className="font-medium">{itemStats?.products ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Container className="h-3.5 w-3.5" /> Equipos
                  </span>
                  <span className="font-medium">{itemStats?.equipment ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5" /> Herramientas
                  </span>
                  <span className="font-medium">{itemStats?.tools ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <LayoutGrid className="h-3.5 w-3.5" /> Kits
                  </span>
                  <span className="font-medium">{itemStats?.kits ?? 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total items (Sin kits)</span>
                  <span className="font-semibold">
                    {(itemStats?.products ?? 0) +
                      (itemStats?.equipment ?? 0) +
                      (itemStats?.tools ?? 0)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Movements breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              Desglose de Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMov ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Compras
                  </span>
                  <span className="font-medium">{movStats?.purchases ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Devoluciones
                  </span>
                  <span className="font-medium">{movStats?.returns ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Salidas
                  </span>
                  <span className="font-medium">{movStats?.exits ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" /> Bajas
                  </span>
                  <span className="font-medium">{movStats?.writeoffs ?? 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total histórico</span>
                  <span className="font-semibold">{movStats?.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Este mes</span>
                  <Badge variant="secondary">{movStats?.thisMonth ?? 0}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Welcome / admin users card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Users className="h-4 w-4 text-muted-foreground" /> Resumen de Usuarios
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 text-muted-foreground" /> Bienvenido
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              loadingUsers ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de usuarios</span>
                    <span className="font-medium">{userStats?.total ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Administradores</span>
                    <span className="font-medium">{userStats?.admins ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Con área asignada</span>
                    <span className="font-medium">{userStats?.active ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sin área asignada</span>
                    <span className="font-medium">{userStats?.inactive ?? 0}</span>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Hola, <span className="font-semibold text-foreground">{displayName}</span>. Este
                  es tu panel de gestión de inventario.
                </p>
                <p>Consulta el stock, revisa movimientos o accede a los proyectos desde el menú.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
