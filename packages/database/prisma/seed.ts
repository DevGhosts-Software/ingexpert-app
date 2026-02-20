import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@ingexpert.com';
const ADMIN_PASSWORD = '123456789';

const adminUpsertData = {
  role: 'ADMIN' as const,
  name: 'Super Admin',
};

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

  console.log(`Checking if Super Admin (${ADMIN_EMAIL}) exists...`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users from Supabase:', listError.message);
    throw listError;
  }

  const existingUser = users.users.find((u) => u.email === ADMIN_EMAIL);
  let userId: string;

  if (!existingUser) {
    console.log('Creating Super Admin in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { nombre: adminUpsertData.name, rol: adminUpsertData.role },
    });

    if (authError) {
      console.error('Error creating user in Supabase:', authError.message);
      throw authError;
    }

    userId = authUser.user.id;
    console.log('Super Admin created in Supabase Auth with ID:', userId);
  } else {
    console.log('Super Admin already exists in Supabase Auth.');
    userId = existingUser.id;
  }

  // Upsert into Prisma (safety net — normally handled by the DB trigger)
  await prisma.user.upsert({
    where: { id: userId },
    update: { role: adminUpsertData.role },
    create: { id: userId, email: ADMIN_EMAIL, ...adminUpsertData },
  });
  console.log('Ensured Super Admin consistency in local database.');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
