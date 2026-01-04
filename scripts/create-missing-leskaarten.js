import XLSX from 'xlsx';
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

// Parse datum range (bijv. "12-12-25 / 13-03-2026" of "12-12-2025 / 13-03-2026")
function parseDatumRange(datumString) {
  if (!datumString || typeof datumString !== 'string') return null;
  
  const parts = datumString.split('/').map(s => s.trim());
  if (parts.length !== 2) return null;
  
  const [startStr, endStr] = parts;
  
  // Parse start datum (kan zijn: "12-12-25" of "12-12-2025")
  const startParts = startStr.split('-');
  if (startParts.length !== 3) return null;
  
  let startDay = parseInt(startParts[0]);
  let startMonth = parseInt(startParts[1]) - 1; // JavaScript maanden zijn 0-indexed
  let startYear = parseInt(startParts[2]);
  
  // Als jaar 2 cijfers, voeg 2000 toe (bijv. 25 -> 2025)
  if (startYear < 100) {
    startYear += 2000;
  }
  
  // Parse eind datum
  const endParts = endStr.split('-');
  if (endParts.length !== 3) return null;
  
  let endDay = parseInt(endParts[0]);
  let endMonth = parseInt(endParts[1]) - 1;
  let endYear = parseInt(endParts[2]);
  
  if (endYear < 100) {
    endYear += 2000;
  }
  
  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, endDay);
  
  // Format als YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
}

// Normaliseer naam voor vergelijking
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

// Fuzzy match namen
function namesMatch(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // Gedeeltelijke match
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Check of delen overeenkomen
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    if (parts1[0] === parts2[0] && parts1[parts1.length - 1] === parts2[parts2.length - 1]) {
      return true;
    }
  }
  
  return false;
}

async function createMissingLeskaarten() {
  const excelPath = 'Klanten bestand 4-1-2026.xlsx';
  
  console.log(`\n📖 Excel bestand lezen: ${excelPath}...`);
  
  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (error) {
    console.error(`❌ Kan Excel bestand niet lezen: ${error.message}`);
    process.exit(1);
  }
  
  // Zoek "Leskaarten" sheet
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('leskaart')
  );
  
  if (!sheetName) {
    console.error('❌ Geen "Leskaarten" sheet gevonden!');
    process.exit(1);
  }
  
  console.log(`✅ Sheet gevonden: "${sheetName}"`);
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  
  // Vind header rij
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const rowString = row.join(' ').toLowerCase();
      if (rowString.includes('voornaam') && rowString.includes('duur leskaart')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    console.error('❌ Header rij niet gevonden!');
    process.exit(1);
  }
  
  console.log(`✅ Header rij gevonden op rij ${headerRowIndex + 1}`);
  
  // Kolom mapping
  const columns = {
    voornaam: 0,           // Kolom A
    achternaam: 1,         // Kolom B
    duur: 2,               // Kolom C
    gebruikteLessen: 3,     // Kolom D
    resterendeLessen: 4    // Kolom E
  };
  
  // Lees ook de "Manege klanten" sheet voor email matching
  console.log('📧 Email adressen ophalen uit "Manege klanten" sheet...');
  const manegeSheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('manege') && name.toLowerCase().includes('klant')
  );
  
  const emailMap = new Map(); // naam -> email
  
  if (manegeSheetName) {
    const manegeWorksheet = workbook.Sheets[manegeSheetName];
    const manegeData = XLSX.utils.sheet_to_json(manegeWorksheet, { header: 1, defval: null });
    
    // Vind header rij
    let manegeHeaderIndex = -1;
    let emailCol = -1;
    let voornaamCol = -1;
    let achternaamCol = -1;
    
    for (let i = 0; i < Math.min(10, manegeData.length); i++) {
      const row = manegeData[i];
      if (row && Array.isArray(row)) {
        const rowString = row.join(' ').toLowerCase();
        if (rowString.includes('voornaam') && rowString.includes('achternaam')) {
          manegeHeaderIndex = i;
          row.forEach((cell, idx) => {
            const cellStr = (cell || '').toString().toLowerCase();
            if (cellStr.includes('voornaam')) voornaamCol = idx;
            if (cellStr.includes('achternaam')) achternaamCol = idx;
            if (cellStr.includes('e-mail') || cellStr.includes('email')) emailCol = idx;
          });
          break;
        }
      }
    }
    
    if (manegeHeaderIndex >= 0 && emailCol >= 0) {
      for (let i = manegeHeaderIndex + 1; i < manegeData.length; i++) {
        const row = manegeData[i];
        if (!row || row.length === 0) continue;
        
        const voornaam = row[voornaamCol]?.toString().trim() || '';
        const achternaam = row[achternaamCol]?.toString().trim() || '';
        const naam = `${voornaam} ${achternaam}`.trim();
        const email = row[emailCol]?.toString().trim() || '';
        
        if (naam && email) {
          emailMap.set(normalizeName(naam), email.toLowerCase());
        }
      }
      console.log(`✅ ${emailMap.size} email adressen gevonden\n`);
    }
  }
  
  // Haal alle manege klanten op (met email voor matching)
  console.log('\n👥 Manege klanten ophalen uit database...');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('klant_type', 'Manege')
    .eq('status', 'Actief');
  
  if (membersError) {
    console.error('❌ Fout bij ophalen klanten:', membersError);
    process.exit(1);
  }
  
  console.log(`✅ ${members.length} manege klanten gevonden\n`);
  
  // Haal alle bestaande leskaarten op
  console.log('📋 Bestaande leskaarten ophalen...');
  const { data: existingLeskaarten, error: leskaartenError } = await supabase
    .from('leskaarten')
    .select('klant_id, status');
  
  if (leskaartenError) {
    console.error('❌ Fout bij ophalen leskaarten:', leskaartenError);
    process.exit(1);
  }
  
  // Maak map van klant ID naar bestaande leskaart
  const klantenMetLeskaart = new Map();
  existingLeskaarten.forEach(lk => {
    if (!klantenMetLeskaart.has(lk.klant_id) || lk.status === 'actief') {
      klantenMetLeskaart.set(lk.klant_id, lk.status);
    }
  });
  
  console.log(`✅ ${klantenMetLeskaart.size} klanten hebben al een leskaart\n`);
  
  // Parse Excel data - alle leskaarten uit Excel
  const excelLeskaarten = [];
  const errors = [];
  const startRow = headerRowIndex + 1;
  
  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    
    const voornaam = row[columns.voornaam]?.toString().trim() || '';
    const achternaam = row[columns.achternaam]?.toString().trim() || '';
    const naam = `${voornaam} ${achternaam}`.trim();
    
    if (!naam || !voornaam) continue;
    
    const gebruikteLessen = parseInt(row[columns.gebruikteLessen]) || 0;
    const resterendeLessen = parseInt(row[columns.resterendeLessen]) || 0;
    const totaalLessen = gebruikteLessen + resterendeLessen;
    
    const duurString = row[columns.duur]?.toString().trim() || '';
    const datumRange = parseDatumRange(duurString);
    
    if (!datumRange) {
      errors.push({ naam, reden: `Kon datum range niet parsen: "${duurString}"` });
      continue;
    }
    
    // Vind klant - probeer verschillende matching strategieën
    let klant = members.find(m => normalizeName(m.name) === normalizeName(naam));
    
    if (!klant) {
      // Probeer fuzzy match op naam
      klant = members.find(m => namesMatch(m.name, naam));
    }
    
    if (!klant) {
      // Probeer match op voornaam alleen (voor klanten zonder achternaam zoals "Nimka")
      if (!achternaam || achternaam.trim() === '') {
        klant = members.find(m => {
          const mParts = m.name.split(' ');
          return normalizeName(mParts[0]) === normalizeName(voornaam);
        });
      }
    }
    
    if (!klant && emailMap.has(normalizeName(naam))) {
      // Probeer match op email adres
      const excelEmail = emailMap.get(normalizeName(naam));
      klant = members.find(m => m.email && normalizeName(m.email) === normalizeName(excelEmail));
    }
    
    if (!klant) {
      errors.push({ naam, reden: 'Klant niet gevonden in database' });
      continue;
    }
    
    excelLeskaarten.push({
      klantId: klant.id,
      naam: klant.name,
      totaalLessen,
      gebruikteLessen,
      resterendeLessen,
      startDatum: datumRange.start,
      eindDatum: datumRange.end,
      status: resterendeLessen > 0 ? 'actief' : 'opgebruikt'
    });
  }
  
  console.log(`✅ ${excelLeskaarten.length} leskaarten gevonden in Excel`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} fouten bij parsen:`);
    errors.forEach(err => {
      console.log(`   - ${err.naam}: ${err.reden}`);
    });
  }
  console.log('');
  
  // Filter klanten die nog geen leskaart hebben OF waarvan de leskaart moet worden geüpdatet
  const missingLeskaarten = excelLeskaarten.filter(lk => {
    const hasLeskaart = klantenMetLeskaart.has(lk.klantId);
    // Als er geen leskaart is, of als de bestaande leskaart niet actief is, voeg toe
    return !hasLeskaart || klantenMetLeskaart.get(lk.klantId) !== 'actief';
  });
  
  console.log(`📊 ${missingLeskaarten.length} klanten hebben nog geen actieve leskaart\n`);
  
  if (missingLeskaarten.length === 0) {
    console.log('✨ Alle klanten hebben al een actieve leskaart!');
    return;
  }
  
  // Maak leskaarten aan
  console.log('📝 Leskaarten aanmaken...\n');
  console.log('═'.repeat(60));
  
  const results = {
    created: 0,
    errors: 0
  };
  
  for (const leskaart of missingLeskaarten) {
    try {
      const { error: insertError } = await supabase
        .from('leskaarten')
        .insert([{
          klant_id: leskaart.klantId,
          totaal_lessen: leskaart.totaalLessen,
          gebruikte_lessen: leskaart.gebruikteLessen,
          resterende_lessen: leskaart.resterendeLessen,
          start_datum: leskaart.startDatum,
          eind_datum: leskaart.eindDatum,
          status: leskaart.status
        }]);
      
      if (insertError) {
        console.error(`❌ Fout bij ${leskaart.naam}:`, insertError.message);
        results.errors++;
      } else {
        console.log(`✅ ${leskaart.naam} (${leskaart.gebruikteLessen} gebruikt, ${leskaart.resterendeLessen} over, geldig tot ${leskaart.eindDatum})`);
        results.created++;
      }
    } catch (error) {
      console.error(`❌ Fout bij ${leskaart.naam}:`, error.message);
      results.errors++;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RESULTATEN:');
  console.log(`   ✅ Nieuwe leskaarten: ${results.created}`);
  console.log(`   ❌ Fouten: ${results.errors}`);
  
  if (results.errors === 0) {
    console.log('\n✨ Alle ontbrekende leskaarten zijn aangemaakt!');
  }
}

createMissingLeskaarten().catch(error => {
  console.error('\n❌ Onverwachte fout:', error);
  process.exit(1);
});

