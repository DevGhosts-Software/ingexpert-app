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
    name: 'Industrial Drill Press',
    location: 'Workshop A',
    stock: 3,
    unit: 'units',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '2',
    name: 'Safety Gloves (Medium)',
    location: 'Storage Room B',
    stock: 45,
    unit: 'pairs',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '3',
    name: 'Torque Wrench Set',
    location: 'Tool Cabinet 1',
    stock: 8,
    unit: 'units',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '4',
    name: 'Emergency Response Kit',
    location: 'Main Hallway',
    stock: 2,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '5',
    name: 'Hydraulic Jack',
    location: 'Workshop A',
    stock: 5,
    unit: 'units',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '6',
    name: 'Cutting Discs 115mm',
    location: 'Storage Room B',
    stock: 0,
    unit: 'pcs',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '7',
    name: 'Angle Grinder',
    location: 'Tool Cabinet 2',
    stock: 4,
    unit: 'units',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '8',
    name: 'First Aid Kit Deluxe',
    location: 'Office Floor 2',
    stock: 1,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '9',
    name: 'Lubricating Oil 1L',
    location: 'Storage Room A',
    stock: 120,
    unit: 'bottles',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '10',
    name: 'Oscilloscope Digital',
    location: 'Lab Room 1',
    stock: 2,
    unit: 'units',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '11',
    name: 'Soldering Iron 60W',
    location: 'Lab Room 1',
    stock: 12,
    unit: 'units',
    type: 'TOOL',
    imageUrl: '',
  },
  {
    id: '12',
    name: 'Plumbing Repair Kit',
    location: 'Maintenance Shed',
    stock: 6,
    unit: 'kits',
    type: 'KIT',
    imageUrl: '',
  },
  {
    id: '13',
    name: 'Cable Ties 200mm',
    location: 'Storage Room A',
    stock: 7,
    unit: 'bags',
    type: 'PRODUCT',
    imageUrl: '',
  },
  {
    id: '14',
    name: 'Air Compressor 50L',
    location: 'Workshop B',
    stock: 1,
    unit: 'units',
    type: 'EQUIPMENT',
    imageUrl: '',
  },
  {
    id: '15',
    name: 'Hex Key Set',
    location: 'Tool Cabinet 1',
    stock: 9,
    unit: 'sets',
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
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Manage and track all your stock items, equipment, tools, and kits.
        </p>
      </div>

      <InventoryStats stats={stats} />
      <InventoryTable items={mockItems} />
    </div>
  );
}
