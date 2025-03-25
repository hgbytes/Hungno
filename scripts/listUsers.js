import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found in the database');
    } else {
      console.log('Users in the database:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.user_metadata?.role || 'user'})`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listUsers(); 