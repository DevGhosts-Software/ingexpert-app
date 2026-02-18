import { Package, Wrench, Hammer, Boxes, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface InventoryStats {
  total: number;
  products: number;
  equipment: number;
  tools: number;
  kits: number;
  lowStock: number;
}

interface InventoryStatsProps {
  stats: InventoryStats;
}

const statCards = [
  {
    key: 'total' as keyof InventoryStats,
    label: 'Total Items',
    icon: Boxes,
    description: 'Across all categories',
    colorClass: 'text-blue-500',
  },
  {
    key: 'products' as keyof InventoryStats,
    label: 'Products',
    icon: Package,
    description: 'Consumable goods',
    colorClass: 'text-green-500',
  },
  {
    key: 'equipment' as keyof InventoryStats,
    label: 'Equipment',
    icon: Wrench,
    description: 'Fixed assets & machinery',
    colorClass: 'text-purple-500',
  },
  {
    key: 'tools' as keyof InventoryStats,
    label: 'Tools',
    icon: Hammer,
    description: 'Hand & power tools',
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
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            {stats.lowStock > 0 && (
              <Badge variant="destructive" className="text-xs">
                Alert
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Items needing restock</p>
        </CardContent>
      </Card>
    </div>
  );
}
