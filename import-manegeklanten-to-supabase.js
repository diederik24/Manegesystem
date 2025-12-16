import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Helper functie om input te vragen
function askQuestion(query) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Lees environment variabelen uit .env.local of .env
let supabaseUrl = '';
let supabaseServiceKey = '';

try {
  const envContent = readFileSync('.env.local', 'utf8') || readFileSync('.env', 'utf8') || '';
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
  });
} catch (e) {
  // .env bestand niet gevonden, gebruik process.env
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

// Als nog steeds geen credentials, vraag interactief
if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n📝 Supabase credentials nodig voor import\n');
  console.log('Je kunt deze vinden in je Supabase Dashboard:');
  console.log('  1. Ga naar Settings > API');
  console.log('  2. Kopieer de Project URL');
  console.log('  3. Kopieer de service_role key (NIET de anon key!)\n');
  
  // Vraag interactief om credentials
  (async () => {
    if (!supabaseUrl) {
      supabaseUrl = await askQuestion('Voer je Supabase URL in: ');
    }
    if (!supabaseServiceKey) {
      supabaseServiceKey = await askQuestion('Voer je Supabase Service Role Key in: ');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('\n❌ Beide credentials zijn verplicht!');
      process.exit(1);
    }
    
    // Voer import uit
    await runImport();
  })();
} else {
  // Direct uitvoeren als credentials al beschikbaar zijn
  runImport();
}

async function runImport() {
  // Maak Supabase client met service role key (voor admin operaties)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Lees Excel bestand
  console.log('\n📖 Excel bestand lezen...');
  const workbook = XLSX.readFile('Manegeklanten.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Converteer naar JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  // Parse de data (skip eerste rij: header)
  const klanten = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip lege rijen
    if (!row || !row[0]) continue;
    
    const voornaam = row[0]?.toString().trim() || '';
    const achternaam = row[1]?.toString().trim() || '';
    const adres = row[2]?.toString().trim() || '';
    const postcode = row[3]?.toString().trim() || '';
    const plaats = row[4]?.toString().trim() || '';
    let telefoon = row[5];
    const email = row[6]?.toString().trim() || '';
    
    // Normaliseer telefoonnummer
    if (telefoon) {
      telefoon = telefoon.toString().replace(/\s+/g, '').replace(/-/g, '');
      if (!telefoon.startsWith('0') && !telefoon.startsWith('+')) {
        telefoon = '0' + telefoon;
      }
    }
    
    // Alleen toevoegen als er minimaal een naam is
    if (voornaam || achternaam) {
      const naam = `${voornaam} ${achternaam}`.trim();
      
      // Debug: log eerste paar klanten om te zien wat er wordt geïmporteerd
      if (klanten.length < 3) {
        console.log(`\n📋 Voorbeeld klant ${klanten.length + 1}:`);
        console.log(`   Naam: ${naam}`);
        console.log(`   Adres: ${adres || '(leeg)'}`);
        console.log(`   Postcode: ${postcode || '(leeg)'}`);
        console.log(`   Plaats: ${plaats || '(leeg)'}`);
        console.log(`   Telefoon: ${telefoon || '(leeg)'}`);
        console.log(`   Email: ${email || '(leeg)'}`);
      }
      
      klanten.push({
        name: naam,
        email: email || null,
        phone: telefoon || null,
        adres: adres || null,
        postcode: postcode || null,
        plaats: plaats || null,
        klant_type: 'Manege',
        status: 'Actief',
        balance: 0
      });
    }
  }

  console.log(`✅ ${klanten.length} manege klanten gevonden\n`);

  // Test database connectie
  console.log('🔌 Testen database connectie...');
  const { data: testData, error: testError } = await supabase
    .from('members')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('❌ Database connectie fout:', testError.message);
    console.log('\nMogelijke oorzaken:');
    console.log('  - Verkeerde URL of Service Role Key');
    console.log('  - Database tabel "members" bestaat nog niet');
    console.log('  - Row Level Security (RLS) blokkeert de connectie');
    process.exit(1);
  }
  
  console.log('✅ Database connectie succesvol!\n');

  // Importeer klanten naar Supabase
  async function importKlanten() {
    console.log('📤 Klanten importeren naar Supabase...');
    
    const results = {
      success: 0,
      errors: 0,
      skipped: 0,
      updated: 0
    };
    
    for (const klant of klanten) {
      try {
        // Check of klant al bestaat (op basis van email of naam)
        let existingMember = null;
        
        if (klant.email) {
          const { data: emailMatch } = await supabase
            .from('members')
            .select('id, name, email')
            .eq('email', klant.email)
            .single();
          
          if (emailMatch) {
            existingMember = emailMatch;
          }
        }
        
        // Als niet gevonden op email, check op naam en klant_type
        if (!existingMember) {
          const { data: nameMatch } = await supabase
            .from('members')
            .select('id, name, email')
            .eq('name', klant.name)
            .eq('klant_type', 'Manege')
            .single();
          
          if (nameMatch) {
            existingMember = nameMatch;
          }
        }
        
        if (existingMember) {
          // Update bestaande klant
          const { error } = await supabase
            .from('members')
            .update({
              phone: klant.phone || null,
              adres: klant.adres || null,
              postcode: klant.postcode || null,
              plaats: klant.plaats || null,
              klant_type: 'Manege',
              status: 'Actief'
            })
            .eq('id', existingMember.id);
          
          if (error) {
            console.error(`❌ Fout bij updaten ${klant.name}:`, error.message);
            results.errors++;
          } else {
            console.log(`✓ Updated: ${klant.name}`);
            results.updated++;
            results.success++;
          }
        } else {
          // Nieuwe klant aanmaken
          const { data, error } = await supabase
            .from('members')
            .insert([klant])
            .select()
            .single();
          
          if (error) {
            console.error(`❌ Fout bij aanmaken ${klant.name}:`, error.message);
            results.errors++;
          } else {
            console.log(`✓ Created: ${klant.name}`);
            results.success++;
          }
        }
      } catch (error) {
        console.error(`❌ Onverwachte fout bij ${klant.name}:`, error.message);
        results.errors++;
      }
    }
    
    return results;
  }

  // Voer import uit
  try {
    console.log('🚀 Start import proces...\n');
    
    const klantenResult = await importKlanten();
    console.log(`\n📊 Import resultaat:`);
    console.log(`   ✓ Nieuw aangemaakt: ${klantenResult.success - klantenResult.updated}`);
    console.log(`   ✓ Geüpdatet: ${klantenResult.updated}`);
    console.log(`   ❌ Errors: ${klantenResult.errors}`);
    
    console.log('\n✅ Import voltooid!');
  } catch (error) {
    console.error('\n❌ Fout tijdens import:', error);
    process.exit(1);
  }
}

