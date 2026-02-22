import { createClient } from '@supabase/supabase-js';
import { ItemType, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

dotenv.config();

const prisma = new PrismaClient();

// ─── Seed users ──────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    email: 'admin@ingexpert.com',
    password: '123456789',
    name: 'Super Admin',
    role: 'ADMIN' as const,
  },
  {
    email: 'user@ingexpert.com',
    password: '123456789',
    name: 'Usuario Demo',
    role: 'USER' as const,
  },
];

// ─── Item generation helpers ─────────────────────────────────────────────────

const ITEM_TYPES: ItemType[] = ['PRODUCT', 'EQUIPMENT', 'TOOL', 'KIT'];

const LOCATIONS = [
  'Taller A',
  'Taller B',
  'Taller C',
  'Almacén 1',
  'Almacén 2',
  'Oficina Principal',
  'Bodega Norte',
  'Bodega Sur',
  'Sala de Mantenimiento',
  'Depósito Externo',
];

const UNITS = ['unidades', 'piezas', 'metros', 'kilogramos', 'litros', 'cajas', 'pares', 'juegos'];

const ITEM_NAMES: Record<ItemType, string[]> = {
  PRODUCT: [
    'Tornillo Hexagonal M8',
    'Tornillo Hexagonal M10',
    'Tuerca M8',
    'Tuerca M10',
    'Arandela Plana',
    'Arandela de Presión',
    'Perno de Anclaje',
    'Remache Pop 4mm',
    'Cable Eléctrico 2.5mm',
    'Cable Eléctrico 4mm',
    'Cinta Aislante',
    'Conector RJ45',
    'Tubo PVC 1/2"',
    'Tubo PVC 3/4"',
    'Codo PVC 90°',
    'Tee PVC 1/2"',
    'Pintura Anticorrosiva',
    'Sellador de Silicona',
    'Lija N°120',
    'Lija N°220',
    'Aceite Lubricante 1L',
    'Grasa Industrial',
    'Filtro de Aire',
    'Filtro de Aceite',
  ],
  EQUIPMENT: [
    'Taladradora Industrial 750W',
    'Taladradora de Banco',
    'Esmeriladora Angular 4.5"',
    'Esmeriladora Angular 7"',
    'Sierra Circular 7.25"',
    'Sierra de Mesa 10"',
    'Soldadora MIG 200A',
    'Soldadora TIG 160A',
    'Compresor de Aire 50L',
    'Compresor de Aire 100L',
    'Generador 5500W',
    'Bomba de Agua 1HP',
    'Fresadora CNC 3 Ejes',
    'Torno Industrial',
    'Prensa Hidráulica 20T',
  ],
  TOOL: [
    'Llave Inglesa 12"',
    'Llave Inglesa 18"',
    'Juego de Llaves Combinadas',
    'Destornillador Plano 6"',
    'Destornillador Phillips #2',
    'Juego de Destornilladores',
    'Martillo de Bola 500g',
    'Mazo de Goma',
    'Alicate Universal 8"',
    'Alicate de Corte',
    'Alicate de Presión',
    'Llave Torque 1/2"',
    'Nivel de Burbuja 60cm',
    'Cinta Métrica 5m',
    'Cinta Métrica 10m',
    'Cincel Plano 1"',
    'Punzón de Centrado',
    'Lima Plana Media',
    'Segueta Manual',
    'Escuadra 30cm',
  ],
  KIT: [
    'Kit de Herramientas Básicas',
    'Kit de Electricidad Doméstica',
    'Kit de Plomería Básica',
    'Kit de Soldadura Completo',
    'Kit de Medición y Trazado',
    'Kit de Primeros Auxilios Industrial',
    'Kit de Seguridad Personal',
    'Kit de Mantenimiento Preventivo',
    'Kit de Herramientas Neumáticas',
    'Kit de Diagnóstico Eléctrico',
  ],
};

function pick<T>(arr: T[]): T {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStock(): number {
  const roll = Math.random();
  if (roll < 0.1) return 0; // 10% sin stock
  if (roll < 0.25) return Math.floor(Math.random() * 9) + 1; // 15% stock bajo
  return Math.floor(Math.random() * 200) + 10; // 75% normal
}

function generateItems(count: number) {
  const usedCodes = new Set<string>();
  const items = [];

  for (let i = 0; i < count; i++) {
    const type = pick(ITEM_TYPES);
    const namePool = ITEM_NAMES[type];
    const baseName = pick(namePool);
    // Append a suffix to avoid duplicate names
    const name = `${baseName} ${String(i + 1).padStart(3, '0')}`;
    let code: string;
    do {
      const prefix = type.slice(0, 3);
      code = `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    } while (usedCodes.has(code));
    usedCodes.add(code);

    items.push({
      name,
      code,
      type,
      location: pick(LOCATIONS),
      stock: randomStock(),
      unit: pick(UNITS),
      imageUrl: '',
    });
  }

  return items;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { users: existingAuthUsers },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users from Supabase:', listError.message);
    throw listError;
  }

  // ── Seed users ──
  for (const seedUser of SEED_USERS) {
    console.log(`\nChecking user: ${seedUser.email}...`);
    const existing = existingAuthUsers.find((u) => u.email === seedUser.email);
    let userId: string;

    if (!existing) {
      console.log(`  Creating in Supabase Auth...`);
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: seedUser.email,
        password: seedUser.password,
        email_confirm: true,
        user_metadata: { nombre: seedUser.name, rol: seedUser.role },
      });
      if (authError) {
        console.error(`  Error creating user: ${authError.message}`);
        throw authError;
      }
      userId = authUser.user.id;
      console.log(`  Created with ID: ${userId}`);
    } else {
      console.log(`  Already exists in Supabase Auth.`);
      userId = existing.id;
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: { role: seedUser.role },
      create: { id: userId, email: seedUser.email, name: seedUser.name, role: seedUser.role },
    });
    console.log(`  Ensured consistency in local DB.`);
  }

  // ── Seed items ──
  const existingCount = await prisma.item.count();
  if (existingCount >= 100) {
    console.log(`\nItems already seeded (${existingCount} found). Skipping item generation.`);
  } else {
    const needed = 100 - existingCount;
    console.log(`\nGenerating ${needed} items (${existingCount} already exist)...`);
    const items = generateItems(needed);
    await prisma.item.createMany({ data: items });
    console.log(`  Created ${needed} items successfully.`);
  }

  // ── Run SQL script ──
  const sqlPath = path.join(__dirname, 'app-data bucket policies.sql');
  if (fs.existsSync(sqlPath)) {
    console.log('\nRunning SQL script: app-data bucket policies.sql...');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const dbClient = new Client({
      connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    });
    await dbClient.connect();
    try {
      await dbClient.query(sql);
      console.log('  SQL script executed successfully.');
    } finally {
      await dbClient.end();
    }
  } else {
    console.warn('\nSQL script not found, skipping.');
  }

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
