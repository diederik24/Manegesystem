/**
 * Eenvoudig script om een testaccount aan te maken
 * Dit maakt alleen het Auth account aan, koppeling moet via SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseUrl = '';
let supabaseServiceRoleKey = '';

// Lees .env bestanden
try {
  let envContent = '';
  try {
    envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  } catch (e) {
    try {
      envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    } catch (e2) {}
  }
  
  if (envContent) {
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceRoleKey = value;
      }
    });
  }
} catch (e) {}

if (!supabaseUrl) supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (!supabaseServiceRoleKey) supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Fout: SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY moeten zijn ingesteld');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount() {
  try {
    console.log('🔐 Testaccount aanmaken...\n');

    const testEmail = 'test@duiksehoef.nl';
    const testPassword = 'Test123456!';
    
    // Vind een klant met leskaarten
    console.log('📋 Zoeken naar een klant met actieve leskaarten...');
    const { data: membersWithLeskaarten } = await supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        leskaarten!inner(id, status)
      `)
      .eq('leskaarten.status', 'actief')
      .limit(1);

    let memberId;
    let memberName;
    
    if (membersWithLeskaarten && membersWithLeskaarten.length > 0) {
      memberId = membersWithLeskaarten[0].id;
      memberName = membersWithLeskaarten[0].name;
    } else {
      const { data: firstMember } = await supabase
        .from('members')
        .select('id, name, email')
        .limit(1)
        .single();

      if (!firstMember) {
        console.error('❌ Geen klanten gevonden in de database');
        process.exit(1);
      }

      memberId = firstMember.id;
      memberName = firstMember.name;
    }

    console.log(`✅ Klant gevonden: ${memberName}`);
    console.log(`   Member ID: ${memberId}\n`);

    // Maak of haal auth account op
    console.log(`📧 Auth account aanmaken: ${testEmail}...`);
    let authUserId;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.code === 'email_exists' || authError.message?.includes('already registered')) {
        console.log('⚠️  Account bestaat al, ophalen...');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === testEmail);
        
        if (!user) {
          console.error('❌ Account bestaat maar kan niet worden gevonden');
          process.exit(1);
        }

        authUserId = user.id;
        console.log(`✅ Bestaand account gevonden: ${authUserId}\n`);
      } else {
        throw authError;
      }
    } else {
      authUserId = authData.user.id;
      console.log(`✅ Auth account aangemaakt: ${authUserId}\n`);
    }

    // Genereer SQL voor koppeling
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 INLOG GEGEVENS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${testEmail}`);
    console.log(`Wachtwoord: ${testPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔗 KOPPEL ACCOUNT AAN KLANT:');
    console.log('Voer deze SQL uit in Supabase SQL Editor:\n');
    console.log(`SELECT klantappversie1.link_customer_account(`);
    console.log(`  '${authUserId}'::UUID,`);
    console.log(`  '${memberId}'::UUID`);
    console.log(`);\n`);
    
    console.log('🌐 Login URL: http://localhost:3000/login');
    console.log('   (of je Vercel deployment URL)\n');
    
  } catch (error) {
    console.error('❌ Onverwachte fout:', error);
    process.exit(1);
  }
}

createTestAccount();






