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
  const workbook = XLSX.readFile('Pension Klanten bestand 2025.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Converteer naar JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  // Parse de data (skip eerste 2 rijen: titel en header)
  const klanten = [];
  const paardenData = [];

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    
    // Skip lege rijen
    if (!row || !row[0]) continue;
    
    const voornaam = row[0]?.toString().trim() || '';
    const achternaam = row[2]?.toString().trim() || '';
    const adres = row[4]?.toString().trim() || '';
    const postcode = row[7]?.toString().trim() || '';
    const plaats = row[9]?.toString().trim() || '';
    let telefoon = row[11];
    const email = row[13]?.toString().trim() || '';
    const paard = row[17]?.toString().trim() || '';
    
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
      
      klanten.push({
        name: naam,
        email: email || null,
        phone: telefoon || null,
        adres: adres || null,
        postcode: postcode || null,
        plaats: plaats || null,
        klant_type: 'Pension',
        status: 'Actief',
        balance: 0
      });
      
      // Sla paard data op voor later (na het aanmaken van de klant)
      if (paard) {
        paardenData.push({
          naam,
          paardNamen: paard.split('/').map(p => p.trim()).filter(p => p)
        });
      }
    }
  }

  console.log(`✅ ${klanten.length} pension klanten gevonden`);
  console.log(`✅ ${paardenData.reduce((sum, p) => sum + p.paardNamen.length, 0)} paarden gevonden\n`);

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
    console.log('\nZorg ervoor dat je eerst de migration uitvoert: database-migration-pension-klanten.sql');
    process.exit(1);
  }
  
  console.log('✅ Database connectie succesvol!\n');

  // Importeer klanten naar Supabase
  async function importKlanten() {
    console.log('📤 Klanten importeren naar Supabase...');
    
    const results = {
      success: 0,
      errors: 0,
      skipped: 0
    };
    
    for (const klant of klanten) {
      try {
        // Check of klant al bestaat (op basis van naam en email)
        let existingMember = null;
        
        if (klant.email) {
          const { data: emailMatch } = await supabase
            .from('members')
            .select('id')
            .eq('email', klant.email)
            .single();
          
          if (emailMatch) {
            existingMember = emailMatch;
          }
        }
        
        // Als niet gevonden op email, check op naam
        if (!existingMember) {
          const { data: nameMatch } = await supabase
            .from('members')
            .select('id')
            .eq('name', klant.name)
            .eq('klant_type', 'Pension')
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
              phone: klant.phone || existingMember.phone,
              adres: klant.adres || existingMember.adres,
              postcode: klant.postcode || existingMember.postcode,
              plaats: klant.plaats || existingMember.plaats,
              klant_type: 'Pension'
            })
            .eq('id', existingMember.id);
          
          if (error) {
            console.error(`❌ Fout bij updaten ${klant.name}:`, error.message);
            results.errors++;
          } else {
            console.log(`✓ Updated: ${klant.name}`);
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

  // Importeer paarden
  async function importPaarden() {
    console.log('\n📤 Paarden importeren naar Supabase...');
    
    const results = {
      success: 0,
      errors: 0
    };
    
    for (const paardInfo of paardenData) {
      // Vind de klant ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('name', paardInfo.naam)
        .eq('klant_type', 'Pension')
        .single();
      
      if (!member) {
        console.log(`⚠️  Klant niet gevonden voor paard eigenaar: ${paardInfo.naam}`);
        continue;
      }
      
      // Voeg elk paard toe
      for (const paardNaam of paardInfo.paardNamen) {
        // Check of paard al bestaat
        const { data: existingHorse } = await supabase
          .from('horses')
          .select('id')
          .eq('name', paardNaam)
          .eq('owner_id', member.id)
          .single();
        
        if (existingHorse) {
          console.log(`⏭️  Paard al bestaat: ${paardNaam} (${paardInfo.naam})`);
          continue;
        }
        
        const { error } = await supabase
          .from('horses')
          .insert([{
            name: paardNaam,
            breed: 'Onbekend',
            available: true,
            type: 'Pension',
            owner_id: member.id
          }]);
        
        if (error) {
          console.error(`❌ Fout bij aanmaken paard ${paardNaam}:`, error.message);
          results.errors++;
        } else {
          console.log(`✓ Created: ${paardNaam} (${paardInfo.naam})`);
          results.success++;
        }
      }
    }
    
    return results;
  }

  // Voer import uit
  try {
    console.log('🚀 Start import proces...\n');
    
    const klantenResult = await importKlanten();
    console.log(`\n📊 Klanten import resultaat:`);
    console.log(`   ✓ Success: ${klantenResult.success}`);
    console.log(`   ❌ Errors: ${klantenResult.errors}`);
    console.log(`   ⏭️  Skipped: ${klantenResult.skipped}`);
    
    const paardenResult = await importPaarden();
    console.log(`\n📊 Paarden import resultaat:`);
    console.log(`   ✓ Success: ${paardenResult.success}`);
    console.log(`   ❌ Errors: ${paardenResult.errors}`);
    
    console.log('\n✅ Import voltooid!');
  } catch (error) {
    console.error('\n❌ Fout tijdens import:', error);
    process.exit(1);
  }
}
