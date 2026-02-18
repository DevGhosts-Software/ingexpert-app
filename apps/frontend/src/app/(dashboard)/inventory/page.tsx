import {
  InventoryStats,
  type InventoryStats as InventoryStatsType,
} from '@/features/inventory/components/inventory-stats';
import {
  InventoryTable,
  type InventoryItem,
} from '@/features/inventory/components/inventory-table';

// Mock data representing the Item model from the database schema
const mockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Taladradora Industrial',
    location: 'Taller A',
    stock: 3,
    unit: 'unidades',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '2',
    name: 'Guantes de Seguridad (Mediano)',
    location: 'Almacén B',
    stock: 45,
    unit: 'pares',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '3',
    name: 'Juego de Llaves de Torsión',
    location: 'Armario de Herramientas 1',
    stock: 8,
    unit: 'unidades',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '4',
    name: 'Kit de Respuesta de Emergencia',
    location: 'Pasillo Principal',
    stock: 2,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '5',
    name: 'Gato Hidráulico',
    location: 'Taller A',
    stock: 5,
    unit: 'unidades',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '6',
    name: 'Discos de Corte 115mm',
    location: 'Almacén B',
    stock: 0,
    unit: 'piezas',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '7',
    name: 'Amoladora Angular',
    location: 'Armario de Herramientas 2',
    stock: 4,
    unit: 'unidades',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '8',
    name: 'Botiquín de Primeros Auxilios Deluxe',
    location: 'Oficina Piso 2',
    stock: 1,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '9',
    name: 'Aceite Lubricante 1L',
    location: 'Almacén A',
    stock: 120,
    unit: 'botellas',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '10',
    name: 'Osciloscopio Digital',
    location: 'Laboratorio 1',
    stock: 2,
    unit: 'unidades',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '11',
    name: 'Soldador 60W',
    location: 'Laboratorio 1',
    stock: 12,
    unit: 'unidades',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '12',
    name: 'Kit de Reparación de Plomería',
    location: 'Depósito de Mantenimiento',
    stock: 6,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '13',
    name: 'Bridas de Plástico 200mm',
    location: 'Almacén A',
    stock: 7,
    unit: 'bolsas',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '14',
    name: 'Compresor de Aire 50L',
    location: 'Taller B',
    stock: 1,
    unit: 'unidades',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '15',
    name: 'Juego de Llaves Allen',
    location: 'Armario de Herramientas 1',
    stock: 9,
    unit: 'juegos',
    type: 'TOOL',
    imageUrl: '',
  },
];

function computeStats(items: InventoryItem[]): InventoryStatsType {
  return {
    total: items.length,
    products: items.filter((i) => i.type === 'PRODUCT').length,
    equipment: items.filter((i) => i.type === 'EQUIPMENT').length,
    tools: items.filter((i) => i.type === 'TOOL').length,
    kits: items.filter((i) => i.type === 'KIT').length,
    lowStock: items.filter((i) => i.stock > 0 && i.stock < 10).length,
  };
}

export default function InventoryPage() {
  const stats = computeStats(mockItems);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventario</h2>
        <p className="text-muted-foreground">
          Gestiona y realiza seguimiento de todos tus ítems, equipos, herramientas y kits.
        </p>
      </div>

      <InventoryStats stats={stats} />
      <InventoryTable items={mockItems} />
    </div>
  );
}
