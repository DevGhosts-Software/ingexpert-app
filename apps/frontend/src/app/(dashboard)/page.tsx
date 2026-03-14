'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { trpc } from '@/lib/trpc';
import { useMigrationProcedureMode } from '@/lib/api-migration-flags';
import { compareNumericFields } from '@/lib/api-migration-parity';
import { emitMigrationParity, emitMigrationSourceSelection } from '@/lib/api-migration-telemetry';
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

type LocalItemStatsRow = {
  total: number | string | null;
  products: number | string | null;
  equipment: number | string | null;
  tools: number | string | null;
  kits: number | string | null;
};

type LocalMovementStatsRow = {
  total: number | string | null;
  purchases: number | string | null;
  returns: number | string | null;
  exits: number | string | null;
  writeoffs: number | string | null;
  thisMonth: number | string | null;
};

type LocalProjectStatsRow = {
  total: number | string | null;
};

type LocalUserStatsRow = {
  total: number | string | null;
  admins: number | string | null;
  active: number | string | null;
  inactive: number | string | null;
};

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
  const itemStatsMode = useMigrationProcedureMode('items.getStats');
  const movementStatsMode = useMigrationProcedureMode('movements.getStats');
  const projectStatsMode = useMigrationProcedureMode('projects.getStats');
  const userStatsMode = useMigrationProcedureMode('adminUsers.getStats');

  const localItemStatsQuery = useQuery<LocalItemStatsRow>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN type = 'PRODUCT' THEN 1 ELSE 0 END) AS products,
      SUM(CASE WHEN type = 'EQUIPMENT' THEN 1 ELSE 0 END) AS equipment,
      SUM(CASE WHEN type = 'TOOL' THEN 1 ELSE 0 END) AS tools,
      SUM(CASE WHEN type = 'KIT' THEN 1 ELSE 0 END) AS kits
    FROM items
  `);
  const localMovementStatsQuery = useQuery<LocalMovementStatsRow>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN type = 'PURCHASE' THEN 1 ELSE 0 END) AS purchases,
      SUM(CASE WHEN type = 'RETURN' THEN 1 ELSE 0 END) AS returns,
      SUM(CASE WHEN type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN type = 'WRITEOFF' THEN 1 ELSE 0 END) AS writeoffs,
      SUM(
        CASE
          WHEN strftime('%Y-%m', date) = strftime('%Y-%m', 'now', 'localtime')
            THEN 1
          ELSE 0
        END
      ) AS thisMonth
    FROM movements
  `);
  const localProjectStatsQuery = useQuery<LocalProjectStatsRow>(
    'SELECT COUNT(*) AS total FROM projects',
  );
  const localUserStatsQuery = useQuery<LocalUserStatsRow>(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total,
      (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') AS admins,
      (SELECT COUNT(*) FROM staff WHERE work_area_id IS NOT NULL) AS active,
      ((SELECT COUNT(*) FROM users) - (SELECT COUNT(*) FROM staff WHERE work_area_id IS NOT NULL)) AS inactive
  `);

  const localItemStats = useMemo(() => {
    const first = localItemStatsQuery.data?.[0];
    return {
      total: Number(first?.total ?? 0),
      products: Number(first?.products ?? 0),
      equipment: Number(first?.equipment ?? 0),
      tools: Number(first?.tools ?? 0),
      kits: Number(first?.kits ?? 0),
    };
  }, [localItemStatsQuery.data]);
  const localMovementStats = useMemo(() => {
    const first = localMovementStatsQuery.data?.[0];
    return {
      total: Number(first?.total ?? 0),
      purchases: Number(first?.purchases ?? 0),
      returns: Number(first?.returns ?? 0),
      exits: Number(first?.exits ?? 0),
      writeoffs: Number(first?.writeoffs ?? 0),
      thisMonth: Number(first?.thisMonth ?? 0),
    };
  }, [localMovementStatsQuery.data]);
  const localProjectStats = useMemo(() => {
    const first = localProjectStatsQuery.data?.[0];
    return { total: Number(first?.total ?? 0) };
  }, [localProjectStatsQuery.data]);
  const localUserStats = useMemo(() => {
    const first = localUserStatsQuery.data?.[0];
    return {
      total: Number(first?.total ?? 0),
      admins: Number(first?.admins ?? 0),
      active: Number(first?.active ?? 0),
      inactive: Number(first?.inactive ?? 0),
    };
  }, [localUserStatsQuery.data]);

  const useApiItemStats = itemStatsMode !== 'local';
  const useApiMovementStats = movementStatsMode !== 'local';
  const useApiProjectStats = projectStatsMode !== 'local';
  const useApiUserStats = userStatsMode !== 'local';

  const { data: apiItemStats, isLoading: loadingApiItems } = trpc.items.getStats.useQuery(
    undefined,
    {
      enabled: useApiItemStats,
    },
  );
  const { data: apiMovStats, isLoading: loadingApiMov } = trpc.movements.getStats.useQuery(
    undefined,
    {
      enabled: useApiMovementStats,
    },
  );
  const { data: apiProjStats, isLoading: loadingApiProj } = trpc.projects.getStats.useQuery(
    undefined,
    {
      enabled: useApiProjectStats,
    },
  );
  const { data: apiUserStats, isLoading: loadingApiUsers } = trpc.adminUsers.getStats.useQuery(
    undefined,
    { enabled: isAdmin && useApiUserStats },
  );

  const itemStats = itemStatsMode === 'local' ? localItemStats : apiItemStats;
  const movStats = movementStatsMode === 'local' ? localMovementStats : apiMovStats;
  const projStats = projectStatsMode === 'local' ? localProjectStats : apiProjStats;
  const userStats = userStatsMode === 'local' ? localUserStats : apiUserStats;

  const loadingItems =
    itemStatsMode === 'local' ? localItemStatsQuery.isFetching : loadingApiItems || !apiItemStats;
  const loadingMov =
    movementStatsMode === 'local'
      ? localMovementStatsQuery.isFetching
      : loadingApiMov || !apiMovStats;
  const loadingProj =
    projectStatsMode === 'local'
      ? localProjectStatsQuery.isFetching
      : loadingApiProj || !apiProjStats;
  const loadingUsers =
    userStatsMode === 'local'
      ? localUserStatsQuery.isFetching
      : loadingApiUsers || (isAdmin && !apiUserStats);

  useEffect(() => {
    emitMigrationSourceSelection({
      procedure: 'items.getStats',
      mode: itemStatsMode,
      source: useApiItemStats ? 'api' : 'local',
    });
    emitMigrationSourceSelection({
      procedure: 'movements.getStats',
      mode: movementStatsMode,
      source: useApiMovementStats ? 'api' : 'local',
    });
    emitMigrationSourceSelection({
      procedure: 'projects.getStats',
      mode: projectStatsMode,
      source: useApiProjectStats ? 'api' : 'local',
    });
    emitMigrationSourceSelection({
      procedure: 'adminUsers.getStats',
      mode: userStatsMode,
      source: useApiUserStats ? 'api' : 'local',
    });
  }, [
    itemStatsMode,
    movementStatsMode,
    projectStatsMode,
    userStatsMode,
    useApiItemStats,
    useApiMovementStats,
    useApiProjectStats,
    useApiUserStats,
  ]);

  useEffect(() => {
    if (itemStatsMode !== 'dual-run' || !apiItemStats) return;
    const parity = compareNumericFields(localItemStats, apiItemStats, [
      'total',
      'products',
      'equipment',
      'tools',
      'kits',
    ]);
    emitMigrationParity({
      procedure: 'items.getStats',
      mode: 'dual-run',
      matches: parity.matches,
      mismatchKeys: parity.mismatchKeys,
    });
  }, [apiItemStats, itemStatsMode, localItemStats]);

  useEffect(() => {
    if (movementStatsMode !== 'dual-run' || !apiMovStats) return;
    const parity = compareNumericFields(localMovementStats, apiMovStats, [
      'total',
      'purchases',
      'returns',
      'exits',
      'writeoffs',
      'thisMonth',
    ]);
    emitMigrationParity({
      procedure: 'movements.getStats',
      mode: 'dual-run',
      matches: parity.matches,
      mismatchKeys: parity.mismatchKeys,
    });
  }, [apiMovStats, localMovementStats, movementStatsMode]);

  useEffect(() => {
    if (projectStatsMode !== 'dual-run' || !apiProjStats) return;
    const parity = compareNumericFields(localProjectStats, apiProjStats, ['total']);
    emitMigrationParity({
      procedure: 'projects.getStats',
      mode: 'dual-run',
      matches: parity.matches,
      mismatchKeys: parity.mismatchKeys,
    });
  }, [apiProjStats, localProjectStats, projectStatsMode]);

  useEffect(() => {
    if (!isAdmin || userStatsMode !== 'dual-run' || !apiUserStats) return;
    const parity = compareNumericFields(localUserStats, apiUserStats, [
      'total',
      'admins',
      'active',
      'inactive',
    ]);
    emitMigrationParity({
      procedure: 'adminUsers.getStats',
      mode: 'dual-run',
      matches: parity.matches,
      mismatchKeys: parity.mismatchKeys,
    });
  }, [apiUserStats, isAdmin, localUserStats, userStatsMode]);

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
