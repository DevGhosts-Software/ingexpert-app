import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = 'admin@ingexpert.com';
  const password = '123456789';

  console.log(`Checking if Super Admin (${email}) exists...`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users from Supabase:', listError.message);
    throw listError;
  }

  const existingUser = users.users.find((u) => u.email === email);

  if (!existingUser) {
    console.log('Creating Super Admin in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: 'Super Admin',
        rol: 'ADMIN',
      },
    });

    if (authError) {
      console.error('Error creating user in Supabase:', authError.message);
      throw authError;
    }

    const userId = authUser.user.id;
    console.log('Super Admin created in Supabase Auth with ID:', userId);

    // Manual sync to Prisma as a safety measure (Red de Seguridad)
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        role: 'ADMIN',
      },
      create: {
        id: userId,
        email: email,
        role: 'ADMIN',
        name: 'Super Admin',
      },
    });
    console.log('Super Admin synced to local database');
  } else {
    console.log('Super Admin already exists in Supabase Auth.');

    // Ensure it exists in Prisma too
    await prisma.user.upsert({
      where: { id: existingUser.id },
      update: {
        role: 'ADMIN',
      },
      create: {
        id: existingUser.id,
        email: existingUser.email!,
        role: 'ADMIN',
        name: 'Super Admin',
      },
    });
    console.log('Ensured Super Admin consistency in local database.');
  }
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
