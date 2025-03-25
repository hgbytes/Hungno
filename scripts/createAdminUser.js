import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = 'https://onusjteahjfujefhtcdf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123';

  try {
    console.log('Creating admin user...');
    
    // Create the user with admin role
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Admin User'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error.message);
      return;
    }

    if (data?.user) {
      console.log('\nAdmin user created successfully!');
      console.log('----------------------------------------');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('----------------------------------------');
      console.log('\nYou can now log in with these credentials.');
    } else {
      console.log('No user data received');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAdminUser(); 