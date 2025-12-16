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

// Converteer Excel datum naar YYYY-MM-DD
function excelDateToJSDate(excelDate) {
  if (!excelDate) return null;
  
  // Als het al een string is (zoals "1/3/07" of "18/5/2002")
  if (typeof excelDate === 'string') {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      let day = parts[0];
      let month = parts[1];
      let year = parts[2];
      
      // Check of eerste deel > 12, dan is het waarschijnlijk dag-maand-jaar (DD/MM/YYYY)
      // Anders is het maand-dag-jaar (MM/DD/YYYY)
      if (parseInt(day) > 12) {
        // DD/MM/YYYY format
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
      } else {
        // MM/DD/YYYY format - wissel om naar DD/MM/YYYY
        const temp = day;
        day = month.padStart(2, '0');
        month = temp.padStart(2, '0');
      }
      
      // Converteer 2-cijferig jaar naar 4-cijferig
      if (year.length === 2) {
        const yearNum = parseInt(year);
        year = yearNum < 50 ? `20${year}` : `19${year}`;
      }
      
      // Valideer datum
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (monthNum > 12 || dayNum > 31) {
        console.warn(`⚠️  Ongeldige datum: ${excelDate}, overslaan`);
        return null;
      }
      
      return `${year}-${month}-${day}`;
    }
    return null;
  }
  
  // Als het een Excel datum nummer is
  if (typeof excelDate === 'number') {
    // Excel datum begint op 1 januari 1900
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
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
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n📝 Supabase credentials nodig voor import\n');
  console.log('Je kunt deze vinden in je Supabase Dashboard:');
  console.log('  1. Ga naar Settings > API');
  console.log('  2. Kopieer de Project URL');
  console.log('  3. Kopieer de service_role key (NIET de anon key!)\n');
  
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
    
    await runImport();
  })();
} else {
  runImport();
}

async function runImport() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n📖 Excel bestand lezen: Manege Paarden.xlsx...');
  let workbook;
  try {
    workbook = XLSX.readFile('Manege Paarden.xlsx');
  } catch (e) {
    console.error(`❌ Kan bestand niet lezen:`, e.message);
    process.exit(1);
  }
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

  console.log('Headers:', data[0]);
  
  // Parse paarden (skip header rij)
  const paarden = [];
  const skipPaarden = ['Gember', 'Lightning']; // Rode bolletje paarden overslaan
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    
    const naam = row[0]?.toString().trim() || '';
    if (!naam) continue;
    
    // Skip paarden met rode bolletje
    if (skipPaarden.includes(naam)) {
      console.log(`⏭️  Overslaan ${naam} (rode status)`);
      continue;
    }
    
    // Parse geboortedatum
    const geboortedatum = excelDateToJSDate(row[1]);
    
    paarden.push({
      name: naam,
      breed: 'Onbekend',
      birth_date: geboortedatum,
      available: true,
      type: 'Manege',
      owner_id: null
    });
  }

  console.log(`\n✅ ${paarden.length} manegepaarden gevonden (alleen groen bolletje)\n`);

  // Test database connectie
  console.log('🔌 Testen database connectie...');
  const { error: testError } = await supabase
    .from('horses')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('❌ Database connectie fout:', testError.message);
    process.exit(1);
  }
  
  console.log('✅ Database connectie succesvol!\n');

  // Importeer paarden
  console.log('📤 Paarden importeren naar Supabase...');
  
  const results = {
    success: 0,
    errors: 0,
    skipped: 0
  };
  
  for (const paard of paarden) {
    try {
      // Check of paard al bestaat
      const { data: existing } = await supabase
        .from('horses')
        .select('id')
        .eq('name', paard.name)
        .eq('type', 'Manege')
        .single();
      
      if (existing) {
        console.log(`⏭️  Paard al bestaat: ${paard.name}`);
        results.skipped++;
        continue;
      }
      
      // Insert paard
      const { error } = await supabase
        .from('horses')
        .insert([{
          name: paard.name,
          breed: paard.breed,
          birth_date: paard.birth_date,
          available: paard.available,
          type: 'Manege',
          owner_id: null
        }]);
      
      if (error) {
        console.error(`❌ Fout bij aanmaken ${paard.name}:`, error.message);
        results.errors++;
      } else {
        console.log(`✓ Created: ${paard.name}${paard.birth_date ? ` (geboren: ${paard.birth_date})` : ''}`);
        results.success++;
      }
    } catch (error) {
      console.error(`❌ Onverwachte fout bij ${paard.name}:`, error.message);
      results.errors++;
    }
  }
  
  console.log(`\n📊 Import resultaat:`);
  console.log(`   ✓ Nieuw aangemaakt: ${results.success}`);
  console.log(`   ⏭️  Overgeslagen: ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log('\n✅ Import voltooid!');
}
