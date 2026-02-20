import { AlertTriangle, Boxes, Hammer, Package, Wrench } from 'lucide-react';
import type { ItemStats } from '@ingexpert/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type { ItemStats } from '@ingexpert/schema';

interface InventoryStatsProps {
  stats: ItemStats;
}

const statCards: Array<{
  key: keyof ItemStats;
  label: string;
  icon: React.ElementType;
  description: string;
  colorClass: string;
}> = [
  {
    key: 'total',
    label: 'Total de Ítems',
    icon: Boxes,
    description: 'En todas las categorías',
    colorClass: 'text-blue-500',
  },
  {
    key: 'products',
    label: 'Productos',
    icon: Package,
    description: 'Bienes de consumo',
    colorClass: 'text-green-500',
  },
  {
    key: 'equipment',
    label: 'Equipos',
    icon: Wrench,
    description: 'Activos fijos y maquinaria',
    colorClass: 'text-purple-500',
  },
  {
    key: 'tools',
    label: 'Herramientas',
    icon: Hammer,
    description: 'Herramientas manuales y eléctricas',
    colorClass: 'text-orange-500',
  },
];

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map(({ key, label, icon: Icon, description, colorClass }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${colorClass}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[key]}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            {stats.lowStock > 0 && (
              <Badge variant="destructive" className="text-xs">
                Alerta
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Ítems que necesitan reabastecimiento</p>
        </CardContent>
      </Card>
    </div>
  );
}
