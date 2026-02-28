import {
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  TrendingUp,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MovementStats as MovementStatsType } from '@ingexpert/schema';

interface MovementStatsProps {
  stats: MovementStatsType;
}

export function MovementStats({ stats }: MovementStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
          <CardTitle className="text-sm font-medium">Compras</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.purchases}</div>
          <p className="text-xs text-muted-foreground">Ingresos por compra</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Devoluciones</CardTitle>
          <RotateCcw className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.returns}</div>
          <p className="text-xs text-muted-foreground">Material devuelto</p>
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
          <CardTitle className="text-sm font-medium">Bajas</CardTitle>
          <Trash2 className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.writeoffs}</div>
          <p className="text-xs text-muted-foreground">Bajas de inventario</p>
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
