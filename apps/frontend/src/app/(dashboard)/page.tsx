'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function DashboardPage() {
  const { data: user } = trpc.users.me.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Métrica de referencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Métrica de referencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Métrica de referencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Solo tú por ahora</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>¡Bienvenido a Ingexpert, {user?.email}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este es tu panel de gestión de inventario. Aquí podrás hacer seguimiento de tu stock,
            gestionar productos y auditar movimientos.
          </p>
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Primeros pasos</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Ve a Inventario para agregar tu primer producto.</li>
              <li>Configura niveles mínimos de stock para recibir alertas.</li>
              <li>Usa el registro de Movimientos para ver todos los traslados.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
