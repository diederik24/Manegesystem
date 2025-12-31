/**
 * Script om een OTP login code te sturen naar Elvira Straver
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseUrl = '';
let supabaseAnonKey = '';
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
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'VITE_SUPABASE_ANON_KEY' || key === 'SUPABASE_ANON_KEY') supabaseAnonKey = value;
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceRoleKey = value;
      }
    });
  }
} catch (e) {}

if (!supabaseUrl) supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (!supabaseAnonKey) supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!supabaseServiceRoleKey) supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Fout: SUPABASE_URL en SUPABASE_ANON_KEY moeten zijn ingesteld');
  console.error('Gebruik: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node send-otp-to-elvira.js');
  process.exit(1);
}

// Maak Supabase client met anon key (voor OTP)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Maak admin client voor account aanmaken (als nodig)
const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function sendOTPToElvira() {
  try {
    console.log('🔍 Zoeken naar Elvira Straver in de database...\n');

    // Zoek Elvira Straver in de members tabel
    const { data: elviraData, error: searchError } = await supabase
      .from('members')
      .select('id, name, email')
      .or('name.ilike.%elvira%straver%,name.ilike.%elvira%,name.ilike.%straver%')
      .limit(1)
      .single();

    if (searchError || !elviraData) {
      console.error('❌ Elvira Straver niet gevonden in de database');
      console.error('Error:', searchError?.message || 'Geen resultaten');
      process.exit(1);
    }

    const elviraEmail = elviraData.email;
    const elviraName = elviraData.name;

    if (!elviraEmail) {
      console.error('❌ Geen email adres gevonden voor Elvira Straver');
      console.log(`Naam: ${elviraName}`);
      console.log(`ID: ${elviraData.id}`);
      process.exit(1);
    }

    console.log(`✅ Elvira Straver gevonden:`);
    console.log(`   Naam: ${elviraName}`);
    console.log(`   Email: ${elviraEmail}`);
    console.log(`   ID: ${elviraData.id}\n`);

    // Check of er al een Supabase Auth account bestaat
    console.log(`🔍 Controleren of er al een Supabase Auth account bestaat...`);
    let authUserExists = false;
    let authUserId = null;

    if (supabaseAdmin) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(u => u.email === elviraEmail);
      
      if (existingUser) {
        authUserExists = true;
        authUserId = existingUser.id;
        console.log(`✅ Supabase Auth account bestaat al: ${authUserId}\n`);
      } else {
        console.log(`⚠️  Geen Supabase Auth account gevonden, aanmaken...`);
        
        // Maak account aan met service role
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: elviraEmail,
          email_confirm: true, // Auto-confirm email
        });

        if (createError) {
          console.error('❌ Fout bij aanmaken account:', createError.message);
          process.exit(1);
        }

        authUserExists = true;
        authUserId = newUserData.user.id;
        console.log(`✅ Supabase Auth account aangemaakt: ${authUserId}\n`);
      }
    } else {
      console.log(`⚠️  Service role key niet beschikbaar, probeer OTP zonder account check...\n`);
    }

    // Stuur OTP code
    console.log(`📧 OTP code versturen naar ${elviraEmail}...`);
    
    const { data, error: otpError } = await supabase.auth.signInWithOtp({
      email: elviraEmail,
      options: {
        shouldCreateUser: false, // Maak geen nieuwe gebruiker aan
        emailRedirectTo: `${supabaseUrl.replace('/rest/v1', '')}/auth/callback`,
      },
    });

    if (otpError) {
      console.error('❌ Fout bij versturen van OTP code:', otpError.message);
      
      // Als signups niet toegestaan zijn, probeer met shouldCreateUser: true
      if (otpError.message.includes('Signups not allowed')) {
        console.log('\n💡 Probeer met shouldCreateUser: true...');
        const { data: retryData, error: retryError } = await supabase.auth.signInWithOtp({
          email: elviraEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${supabaseUrl.replace('/rest/v1', '')}/auth/callback`,
          },
        });

        if (retryError) {
          console.error('❌ Fout bij tweede poging:', retryError.message);
          console.log('\n💡 Tip: Controleer de Supabase Auth instellingen:');
          console.log('   - Ga naar Supabase Dashboard > Authentication > Settings');
          console.log('   - Zorg dat "Enable email signups" is ingeschakeld');
          console.log('   - Of gebruik "Enable email signups" voor OTP');
          process.exit(1);
        } else {
          console.log('✅ OTP code verstuurd (met shouldCreateUser: true)');
        }
      } else {
        process.exit(1);
      }
    } else {
      console.log('✅ OTP code verstuurd');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OTP CODE VERSTUURD!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${elviraEmail}`);
    console.log(`📬 Check de inbox van ${elviraEmail} voor de 6-cijferige code`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Test de login op:');
    console.log('   http://localhost:3000/login');
    console.log('   (of je Vercel deployment URL)\n');
    console.log('📝 Instructies:');
    console.log('   1. Ga naar de login pagina');
    console.log('   2. Vul het email adres in: ' + elviraEmail);
    console.log('   3. Klik op "Stuur login code"');
    console.log('   4. Check de email voor de 6-cijferige code');
    console.log('   5. Voer de code in en klik "Verifieer code"\n');
    
  } catch (error) {
    console.error('❌ Onverwachte fout:', error);
    process.exit(1);
  }
}

sendOTPToElvira();

