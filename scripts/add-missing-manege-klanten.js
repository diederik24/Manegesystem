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

// Normaliseer telefoonnummer (verwijder spaties en streepjes)
function normalizePhone(phone) {
  if (!phone) return null;
  return phone.toString().replace(/[\s\-]/g, '');
}

async function addMember(memberData) {
  console.log(`\n👤 Klant toevoegen: ${memberData.name}`);
  
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
      console.log(`   ⚠️  Klant "${memberData.name}" bestaat al (ID: ${existingByName[0].id})`);
      return { status: 'exists', member: existingByName[0] };
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
        console.log(`   ⚠️  Email "${memberData.email}" bestaat al bij: ${existingByEmail[0].name}`);
        console.log(`   📝 Update naam naar: ${memberData.name}`);
        
        // Update naam en andere gegevens
        const { data: updated, error: updateError } = await supabase
          .from('members')
          .update({
            name: memberData.name,
            phone: normalizePhone(memberData.phone) || null,
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
        
        console.log(`   ✅ Geüpdatet (ID: ${updated.id})`);
        return { status: 'updated', member: updated };
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
        phone: normalizePhone(memberData.phone) || null,
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
    
    console.log(`   ✅ Toegevoegd (ID: ${data.id})`);
    return { status: 'created', member: data };
  } catch (error) {
    console.error(`   ❌ Fout: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Gegevens van ontbrekende klanten
const missingKlanten = [
  {
    name: 'Fleur van Raak',
    email: 'patrickvanraak@hotmail.com',
    phone: '616060277',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: 'Isaac Tirionplein 29',
    postcode: '5154 MD',
    plaats: 'Waalwijk'
  },
  {
    name: 'Livvy van Vliet',
    email: 'rvvmail@gmail.com',
    phone: '06 40565263',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: 'Ekster 9',
    postcode: '5161 WP',
    plaats: 'Sprang Capelle'
  },
  {
    name: 'Nimka',
    email: 'mirjamvandermooren@yahoo.com',
    phone: '06 18040881',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: null,
    postcode: null,
    plaats: null
  },
  {
    name: 'Lotte Damen',
    email: 'gverduijn@home.nl',
    phone: '06 31998918',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: null,
    postcode: null,
    plaats: null
  },
  {
    name: 'Saskia Rijpert',
    email: 'saskiaenthiemo@gmail.com',
    phone: '06 22438464',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: null,
    postcode: null,
    plaats: 'Drunen'
  },
  {
    name: 'Lilly van der Steen',
    email: 'moniquevdsteen@outlook.com',
    phone: '06-41481452',
    status: 'Actief',
    balance: 0,
    klant_type: 'Manege',
    adres: 'Jan Steenstraat 4',
    postcode: '5143 GR',
    plaats: 'Waalwijk'
  }
];

console.log('📝 Ontbrekende manege klanten toevoegen...\n');
console.log('═'.repeat(60));

const results = {
  created: 0,
  updated: 0,
  exists: 0,
  errors: 0
};

for (const klant of missingKlanten) {
  const result = await addMember(klant);
  if (result.status === 'created') results.created++;
  else if (result.status === 'updated') results.updated++;
  else if (result.status === 'exists') results.exists++;
  else if (result.status === 'error') results.errors++;
}

console.log('\n' + '═'.repeat(60));
console.log('\n📊 RESULTATEN:');
console.log(`   ✅ Nieuw toegevoegd: ${results.created}`);
console.log(`   📝 Geüpdatet: ${results.updated}`);
console.log(`   ⚠️  Bestond al: ${results.exists}`);
console.log(`   ❌ Fouten: ${results.errors}`);

if (results.errors === 0) {
  console.log('\n✨ Alle klanten zijn verwerkt!');
} else {
  console.log('\n⚠️  Er zijn fouten opgetreden. Controleer de output hierboven.');
}

