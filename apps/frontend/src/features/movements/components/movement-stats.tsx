import { ArrowDownCircle, ArrowUpCircle, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MovementStats as MovementStatsType } from '@ingexpert/schema';

interface MovementStatsProps {
  stats: MovementStatsType;
}

export function MovementStats({ stats }: MovementStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Movimientos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Registros históricos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.entries}</div>
          <p className="text-xs text-muted-foreground">Ingresos de material</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salidas</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.exits}</div>
          <p className="text-xs text-muted-foreground">Egresos de material</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            {stats.thisMonth > 0 && (
              <Badge variant="secondary" className="text-xs">
                Activo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Movimientos en el mes actual</p>
        </CardContent>
      </Card>
    </div>
  );
}
