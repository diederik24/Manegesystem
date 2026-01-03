import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Laad environment variables handmatig
function loadEnv() {
  const envPaths = [
    join(__dirname, '..', '.env.local'),
    join(__dirname, '..', '.env'),
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '.env')
  ];

  for (const envPath of envPaths) {
    try {
      if (readFileSync(envPath, 'utf-8')) {
        const envFile = readFileSync(envPath, 'utf-8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
              envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
            }
          }
        });
        Object.assign(process.env, envVars);
        console.log(`✓ Environment variables geladen van: ${envPath}`);
        return;
      }
    } catch (error) {
      // Continue naar volgende pad
    }
  }
  console.log('⚠️  Geen .env bestand gevonden, gebruik environment variables');
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Zorg dat VITE_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

// Maak Supabase client met service role key voor admin operaties
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  const email = 'info@manegeduiksehoef.nl';
  const password = 'Duikse55!';

  console.log('🔐 Beheerder account aanmaken...');
  console.log(`   Email: ${email}`);

  try {
    // Check of gebruiker al bestaat
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('⚠️  Gebruiker bestaat al, wachtwoord wordt bijgewerkt...');
      
      // Update wachtwoord
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Wachtwoord succesvol bijgewerkt!');
      console.log(`   Gebruiker ID: ${existingUser.id}`);
    } else {
      // Maak nieuwe gebruiker aan
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Email direct bevestigen
      });

      if (authError) {
        throw authError;
      }

      console.log('✅ Beheerder account succesvol aangemaakt!');
      console.log(`   Gebruiker ID: ${authData.user.id}`);
    }

    // Test login om te verifiëren dat het werkt
    console.log('\n🧪 Login testen...');
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: testData, error: testError } = await testSupabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (testError) {
      console.error('⚠️  Login test mislukt:', testError.message);
    } else {
      console.log('✅ Login test succesvol!');
      await testSupabase.auth.signOut();
    }

    console.log('\n✨ Klaar! Je kunt nu inloggen met:');
    console.log(`   Email: ${email}`);
    console.log(`   Wachtwoord: ${password}`);

  } catch (error) {
    console.error('❌ Fout bij aanmaken van account:', error.message);
    process.exit(1);
  }
}

createAdminAccount();

