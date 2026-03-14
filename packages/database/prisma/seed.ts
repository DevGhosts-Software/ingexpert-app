import { createClient } from '@supabase/supabase-js';
import { type ItemType, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

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

// ─── Seed projects ────────────────────────────────────────────────────────────

const SEED_PROJECTS = [
  {
    name: 'Planta Industrial Norte',
    contact: '+54 11 4500-1234',
    address: 'Av. Constituyentes 1200, CABA',
  },
  {
    name: 'Obra Vial Ruta 40',
    contact: '+54 261 420-5678',
    address: 'Km 1200, Mendoza',
  },
  {
    name: 'Mantenimiento Refinería Sur',
    contact: '+54 297 480-9012',
    address: 'Parque Industrial, Comodoro Rivadavia',
  },
  {
    name: 'Torre Corporativa Centro',
    contact: '+54 11 5300-3456',
    address: 'Av. Corrientes 900, CABA',
  },
  {
    name: 'Proyecto Minero Puna',
    contact: '+54 388 422-7890',
    address: 'Ruta Provincial 52, Jujuy',
  },
];

// ─── Item generation helpers ─────────────────────────────────────────────────

// How many of each type to generate (total = 90)
const ITEM_DISTRIBUTION: Array<{ type: ItemType; count: number }> = [
  { type: 'PRODUCT', count: 40 },
  { type: 'EQUIPMENT', count: 15 },
  { type: 'TOOL', count: 25 },
  { type: 'KIT', count: 10 },
];

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
    'Electrodo Rutílico 3.2mm',
    'Electrodo Básico 4mm',
    'Hilo de Soldadura MIG 0.9mm',
    'Disco de Corte 4.5"',
    'Disco de Desbaste 7"',
    'Broca HSS 8mm',
    'Broca HSS 10mm',
    'Clavija Eléctrica 16A',
    'Interruptor Térmica 20A',
    'Caja de Pase 10x10',
    'Manga Termorretráctil 6mm',
    'Espiga Metálica 10x80',
    'Silicona Estructural 300ml',
    'Empaque de Goma 1/2"',
    'Válvula de Paso 3/4"',
    'Niple de Acero 1"',
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
    'Espátula 10cm',
    'Llave Allen 5mm',
    'Llave Allen 8mm',
    'Juego de Llaves Allen',
    'Sierra de Mano 12"',
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
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function randomStock(type: ItemType): number {
  if (type === 'KIT') return 0;
  if (type === 'EQUIPMENT') return Math.floor(Math.random() * 3) + 1; // 1–3 units
  const roll = Math.random();
  if (roll < 0.1) return 0; // 10% out-of-stock
  if (roll < 0.25) return Math.floor(Math.random() * 9) + 1; // 15% low stock
  return Math.floor(Math.random() * 200) + 10; // 75% normal
}

function generateItemsOfType(
  type: ItemType,
  count: number,
  usedCodes: Set<string>,
): Array<{
  name: string;
  code: string;
  type: ItemType;
  location: string;
  stock: number;
  unit: string;
  imageUrl: string;
}> {
  const items = [];
  const namePool = ITEM_NAMES[type];
  const prefix = type.slice(0, 3).toUpperCase();

  for (let i = 0; i < count; i++) {
    const baseName = namePool[i % namePool.length]!;
    // Add a numeric suffix when we cycle through names more than once
    const cycle = Math.floor(i / namePool.length);
    const name = cycle > 0 ? `${baseName} (${cycle + 1})` : baseName;

    let code: string;
    do {
      code = `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    } while (usedCodes.has(code));
    usedCodes.add(code);

    items.push({
      name,
      code,
      type,
      location: type === 'KIT' ? '' : pick(LOCATIONS),
      stock: randomStock(type),
      unit: type === 'KIT' ? 'kit' : pick(UNITS),
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

  // ── 1. Seed users ───────────────────────────────────────────────────────────
  console.log('\n── Users ──────────────────────────────────────');
  let adminId: string | null = null;

  for (const seedUser of SEED_USERS) {
    console.log(`Checking: ${seedUser.email}...`);
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
    console.log(`  Ensured in local DB.`);

    if (seedUser.role === 'ADMIN') adminId = userId;
  }

  // ── 2. Seed items ────────────────────────────────────────────────────────────
  console.log('\n── Items ──────────────────────────────────────');
  const totalTarget = ITEM_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
  const existingCount = await prisma.item.count();

  if (existingCount >= totalTarget) {
    console.log(`Items already seeded (${existingCount} found). Skipping.`);
  } else {
    const usedCodes = new Set<string>();

    // Pre-load existing codes so we don't collide
    const existingCodes = await prisma.item.findMany({ select: { code: true } });
    existingCodes.forEach((i) => usedCodes.add(i.code));

    for (const { type, count } of ITEM_DISTRIBUTION) {
      const existingOfType = await prisma.item.count({ where: { type } });
      const needed = count - existingOfType;
      if (needed <= 0) {
        console.log(`  ${type}: already have ${existingOfType}. Skipping.`);
        continue;
      }
      const items = generateItemsOfType(type, needed, usedCodes);
      await prisma.item.createMany({ data: items });
      console.log(`  ${type}: created ${needed} items.`);
    }
  }

  // ── 3. Seed kit compositions ─────────────────────────────────────────────────
  console.log('\n── Kit Compositions ───────────────────────────');
  const emptyKits = await prisma.item.findMany({
    where: { type: 'KIT' },
    include: { _count: { select: { kitDetails: true } } },
  });
  const kitsNeedingComponents = emptyKits.filter((k) => k._count.kitDetails === 0);

  if (kitsNeedingComponents.length === 0) {
    console.log('All kits already have components. Skipping.');
  } else {
    // Fetch eligible components: PRODUCT and TOOL only
    const eligibleComponents = await prisma.item.findMany({
      where: { type: { in: ['PRODUCT', 'TOOL'] } },
      select: { id: true, name: true, type: true },
    });

    if (eligibleComponents.length === 0) {
      console.warn(
        'No PRODUCT or TOOL items found to assign as kit components. Skipping kit composition.',
      );
    } else {
      for (const kit of kitsNeedingComponents) {
        // Pick 3–6 unique components per kit
        const componentCount = Math.floor(Math.random() * 4) + 3;
        const chosen = shuffle(eligibleComponents).slice(0, componentCount);

        const kitDetails = chosen.map((c) => ({
          kitId: kit.id,
          componentId: c.id,
          quantity: Math.floor(Math.random() * 5) + 1, // 1–5 units per component
        }));

        await prisma.kitDetail.createMany({ data: kitDetails });
        console.log(
          `  "${kit.name}": assigned ${kitDetails.length} components (${chosen.map((c) => c.name).join(', ')}).`,
        );
      }
    }
  }

  // ── 4. Seed projects ─────────────────────────────────────────────────────────
  console.log('\n── Projects ────────────────────────────────────');
  if (!adminId) {
    console.warn('No admin user found — skipping project seed.');
  } else {
    const existingProjects = await prisma.project.count();
    if (existingProjects >= SEED_PROJECTS.length) {
      console.log(`Projects already seeded (${existingProjects} found). Skipping.`);
    } else {
      for (const p of SEED_PROJECTS) {
        const exists = await prisma.project.findFirst({ where: { name: p.name } });
        if (exists) {
          console.log(`  "${p.name}": already exists. Skipping.`);
          continue;
        }
        await prisma.project.create({
          data: { ...p, managerId: adminId },
        });
        console.log(`  Created: "${p.name}".`);
      }
    }
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
