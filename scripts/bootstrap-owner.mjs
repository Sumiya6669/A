import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const requiredKeys = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_OWNER_EMAIL',
  'SUPABASE_OWNER_PASSWORD',
];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);
if (missingKeys.length) {
  console.error(`Missing required env: ${missingKeys.join(', ')}`);
  process.exit(1);
}

const role = process.env.SUPABASE_BOOTSTRAP_ROLE || 'owner';
if (!['owner', 'admin'].includes(role)) {
  console.error('SUPABASE_BOOTSTRAP_ROLE must be owner or admin.');
  process.exit(1);
}

const email = process.env.SUPABASE_OWNER_EMAIL;
const password = process.env.SUPABASE_OWNER_PASSWORD;
const fullName = process.env.SUPABASE_OWNER_NAME || 'Oberon Owner';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function findUserByEmail(targetEmail) {
  const normalizedEmail = targetEmail.toLowerCase();
  let page = 1;

  while (page < 100) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
    );
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }

  return null;
}

async function ensureAuthUser() {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName,
        },
        app_metadata: {
          ...existingUser.app_metadata,
          role,
        },
      },
    );

    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
    app_metadata: {
      role,
    },
  });

  if (error) throw error;
  return data.user;
}

async function ensureProfile(user) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      role,
    },
    {
      onConflict: 'id',
    },
  );

  if (error) {
    if (error.code === 'PGRST205' || /profiles/i.test(error.message)) {
      throw new Error(
        'The profiles table is missing. Apply supabase/migrations/20260611190000_oberon_production_schema.sql before bootstrapping the owner.',
      );
    }

    throw error;
  }
}

try {
  const user = await ensureAuthUser();
  await ensureProfile(user);

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: user.id,
        email,
        role,
        message: 'Supabase owner/admin user is ready.',
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
