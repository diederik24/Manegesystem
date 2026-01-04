import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

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

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Zorg dat VITE_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMember(memberData) {
  console.log('👤 Klant toevoegen aan stamgegevens...');
  console.log(`   Naam: ${memberData.name}`);
  console.log(`   Type: ${memberData.klant_type}`);
  
  try {
    // Check of klant al bestaat op basis van naam
    const { data: existingByName, error: checkNameError } = await supabase
      .from('members')
      .select('id, name, email')
      .ilike('name', `%${memberData.name}%`)
      .limit(1);
    
    if (checkNameError && checkNameError.code !== 'PGRST116') {
      throw checkNameError;
    }
    
    if (existingByName && existingByName.length > 0) {
      console.log(`⚠️  Klant "${memberData.name}" bestaat al in database (ID: ${existingByName[0].id})`);
      console.log('   Gebruik update functie om gegevens te wijzigen.');
      return existingByName[0];
    }
    
    // Check of email al bestaat
    if (memberData.email) {
      const { data: existingByEmail, error: checkEmailError } = await supabase
        .from('members')
        .select('id, name, email')
        .eq('email', memberData.email)
        .limit(1);
      
      if (checkEmailError && checkEmailError.code !== 'PGRST116') {
        throw checkEmailError;
      }
      
      if (existingByEmail && existingByEmail.length > 0) {
        console.log(`⚠️  Email "${memberData.email}" bestaat al bij klant: ${existingByEmail[0].name} (ID: ${existingByEmail[0].id})`);
        console.log('   Update naam van bestaande klant naar: ' + memberData.name);
        
        // Update naam van bestaande klant
        const { data: updated, error: updateError } = await supabase
          .from('members')
          .update({
            name: memberData.name,
            phone: memberData.phone || null,
            klant_type: memberData.klant_type,
            adres: memberData.adres || null,
            postcode: memberData.postcode || null,
            plaats: memberData.plaats || null,
            status: memberData.status || 'Actief'
          })
          .eq('id', existingByEmail[0].id)
          .select()
          .single();
        
        if (updateError) {
          throw updateError;
        }
        
        console.log('✅ Klant naam succesvol geüpdatet!');
        console.log(`   ID: ${updated.id}`);
        return updated;
      }
    }
    
    // Genereer UUID voor nieuwe klant
    const memberId = randomUUID();
    
    // Voeg klant toe
    const { data, error } = await supabase
      .from('members')
      .insert([{
        id: memberId,
        name: memberData.name,
        email: memberData.email || null,
        phone: memberData.phone || null,
        status: memberData.status || 'Actief',
        balance: memberData.balance || 0,
        klant_type: memberData.klant_type,
        adres: memberData.adres || null,
        postcode: memberData.postcode || null,
        plaats: memberData.plaats || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Klant succesvol toegevoegd!');
    console.log(`   ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ Fout bij toevoegen klant:', error.message);
    throw error;
  }
}

// Gegevens van Iris van Raak
const irisVanRaak = {
  name: 'Iris van Raak',
  email: 'patrickvanraak@hotmail.com',
  phone: '0616060277',
  status: 'Actief',
  balance: 0,
  klant_type: 'Manege',
  adres: 'Isaac Tirionplein 29',
  postcode: '5154 MD',
  plaats: 'Waalwijk'
};

addMember(irisVanRaak)
  .then(member => {
    if (member) {
      console.log('\n✨ Klaar! Iris van Raak is toegevoegd aan de stamgegevens.');
    }
  })
  .catch(error => {
    console.error('\n❌ Onverwachte fout:', error);
    process.exit(1);
  });

