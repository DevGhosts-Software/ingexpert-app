import {
  MovementStats,
  type MovementStats as MovementStatsType,
} from '@/features/movements/components/movement-stats';
import { MovementTable, type Movement } from '@/features/movements/components/movement-table';

const mockMovements: Movement[] = [
  {
    id: 'a1b2c3d4-0001',
    type: 'ENTRY',
    personalName: 'Carlos Méndez',
    responsibleReceipt: 'Laura Torres',
    project: 'Proyecto Alfa',
    date: new Date('2026-02-15T09:30:00'),
    details: [
      { itemId: '9', itemName: 'Aceite Lubricante 1L', quantity: 50, unit: 'botellas' },
      { itemId: '2', itemName: 'Guantes de Seguridad (Mediano)', quantity: 20, unit: 'pares' },
    ],
  },
  {
    id: 'a1b2c3d4-0002',
    type: 'EXIT',
    personalName: 'María González',
    destination: 'Sitio de Obra Norte',
    responsibleDelivery: 'Pedro Álvarez',
    project: 'Proyecto Beta',
    date: new Date('2026-02-14T14:00:00'),
    details: [
      { itemId: '3', itemName: 'Juego de Llaves de Torsión', quantity: 2, unit: 'unidades' },
      { itemId: '7', itemName: 'Amoladora Angular', quantity: 1, unit: 'unidades' },
    ],
  },
  {
    id: 'a1b2c3d4-0003',
    type: 'EXIT',
    personalName: 'Jorge Ramírez',
    destination: 'Almacén Central',
    responsibleDelivery: 'Ana Castillo',
    date: new Date('2026-02-13T11:15:00'),
    details: [{ itemId: '13', itemName: 'Bridas de Plástico 200mm', quantity: 3, unit: 'bolsas' }],
  },
  {
    id: 'a1b2c3d4-0004',
    type: 'ENTRY',
    personalName: 'Sofía Herrera',
    responsibleReceipt: 'Carlos Méndez',
    project: 'Proyecto Alfa',
    date: new Date('2026-02-12T08:45:00'),
    details: [
      { itemId: '6', itemName: 'Discos de Corte 115mm', quantity: 100, unit: 'piezas' },
      { itemId: '15', itemName: 'Juego de Llaves Allen', quantity: 5, unit: 'juegos' },
    ],
  },
  {
    id: 'a1b2c3d4-0005',
    type: 'EXIT',
    personalName: 'Luis Fernández',
    destination: 'Laboratorio de Pruebas',
    project: 'Proyecto Gamma',
    date: new Date('2026-02-11T16:30:00'),
    details: [
      { itemId: '10', itemName: 'Osciloscopio Digital', quantity: 1, unit: 'unidades' },
      { itemId: '11', itemName: 'Soldador 60W', quantity: 2, unit: 'unidades' },
    ],
  },
  {
    id: 'a1b2c3d4-0006',
    type: 'ENTRY',
    personalName: 'Elena Vargas',
    responsibleReceipt: 'Jorge Ramírez',
    project: 'Proyecto Beta',
    date: new Date('2026-02-10T10:00:00'),
    details: [
      { itemId: '4', itemName: 'Kit de Respuesta de Emergencia', quantity: 3, unit: 'kits' },
      { itemId: '8', itemName: 'Botiquín de Primeros Auxilios Deluxe', quantity: 2, unit: 'kits' },
    ],
  },
  {
    id: 'a1b2c3d4-0007',
    type: 'EXIT',
    personalName: 'Roberto Díaz',
    destination: 'Taller B',
    responsibleDelivery: 'María González',
    date: new Date('2026-01-28T13:00:00'),
    details: [{ itemId: '1', itemName: 'Taladradora Industrial', quantity: 1, unit: 'unidades' }],
  },
  {
    id: 'a1b2c3d4-0008',
    type: 'ENTRY',
    personalName: 'Patricia Morales',
    responsibleReceipt: 'Luis Fernández',
    project: 'Proyecto Gamma',
    date: new Date('2026-01-20T09:00:00'),
    details: [{ itemId: '14', itemName: 'Compresor de Aire 50L', quantity: 1, unit: 'unidades' }],
  },
];

function computeStats(movements: Movement[]): MovementStatsType {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    total: movements.length,
    entries: movements.filter((m) => m.type === 'ENTRY').length,
    exits: movements.filter((m) => m.type === 'EXIT').length,
    thisMonth: movements.filter((m) => m.date >= firstOfMonth).length,
  };
}

export default function MovementsPage() {
  const stats = computeStats(mockMovements);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Movimientos</h2>
        <p className="text-muted-foreground">
          Historial de entradas y salidas de material del inventario.
        </p>
      </div>

      <MovementStats stats={stats} />
      <MovementTable movements={mockMovements} />
    </div>
  );
}
