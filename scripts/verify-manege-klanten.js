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
  
  // Check of delen overeenkomen (bijv. "Anna Klijn" vs "Anna Klijn")
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  
  // Als beide minimaal 2 delen hebben en de eerste delen overeenkomen
  if (parts1.length >= 2 && parts2.length >= 2) {
    if (parts1[0] === parts2[0] && parts1[parts1.length - 1] === parts2[parts2.length - 1]) {
      return true;
    }
  }
  
  return false;
}

async function verifyManegeKlanten() {
  const excelPath = 'Klanten bestand 4-1-2026.xlsx';
  
  console.log(`\n📖 Excel bestand lezen: ${excelPath}...`);
  
  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (error) {
    console.error(`❌ Kan Excel bestand niet lezen: ${error.message}`);
    process.exit(1);
  }
  
  // Zoek "Manege klanten" sheet
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('manege') && name.toLowerCase().includes('klant')
  ) || workbook.SheetNames.find(name => name.toLowerCase().includes('manege'));
  
  if (!sheetName) {
    console.error('❌ Geen "Manege klanten" sheet gevonden!');
    console.log('Beschikbare sheets:', workbook.SheetNames.join(', '));
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
      if (rowString.includes('voornaam') && rowString.includes('achternaam')) {
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
  
  // Vind kolom indices
  const headerRow = rawData[headerRowIndex];
  const columns = {
    voornaam: -1,
    achternaam: -1,
    adres: -1,
    postcode: -1,
    plaats: -1,
    telefoon: -1,
    email: -1
  };
  
  headerRow.forEach((cell, index) => {
    const cellStr = (cell || '').toString().toLowerCase();
    if (cellStr.includes('voornaam')) columns.voornaam = index;
    if (cellStr.includes('achternaam')) columns.achternaam = index;
    if (cellStr.includes('adres')) columns.adres = index;
    if (cellStr.includes('postcode')) columns.postcode = index;
    if (cellStr.includes('plaats')) columns.plaats = index;
    if (cellStr.includes('telefoon')) columns.telefoon = index;
    if (cellStr.includes('e-mail') || cellStr.includes('email')) columns.email = index;
  });
  
  console.log('\n📋 Kolom mapping:');
  Object.entries(columns).forEach(([key, value]) => {
    if (value >= 0) {
      console.log(`   ${key}: kolom ${value}`);
    }
  });
  
  // Haal alle manege klanten uit database
  console.log('\n👥 Manege klanten ophalen uit database...');
  const { data: dbMembers, error: dbError } = await supabase
    .from('members')
    .select('id, name, email, phone, adres, postcode, plaats, status, klant_type')
    .eq('klant_type', 'Manege')
    .eq('status', 'Actief');
  
  if (dbError) {
    console.error('❌ Fout bij ophalen klanten:', dbError);
    process.exit(1);
  }
  
  console.log(`✅ ${dbMembers.length} manege klanten gevonden in database\n`);
  
  // Parse Excel data
  const excelKlanten = [];
  const startRow = headerRowIndex + 1;
  
  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    
    const voornaam = row[columns.voornaam]?.toString().trim() || '';
    const achternaam = row[columns.achternaam]?.toString().trim() || '';
    const naam = `${voornaam} ${achternaam}`.trim();
    
    if (!naam || !voornaam) continue;
    
    excelKlanten.push({
      naam,
      voornaam,
      achternaam,
      adres: row[columns.adres]?.toString().trim() || null,
      postcode: row[columns.postcode]?.toString().trim() || null,
      plaats: row[columns.plaats]?.toString().trim() || null,
      telefoon: row[columns.telefoon]?.toString().trim() || null,
      email: row[columns.email]?.toString().trim() || null
    });
  }
  
  console.log(`✅ ${excelKlanten.length} klanten gevonden in Excel\n`);
  
  // Vergelijk
  const missingInDb = [];
  const missingInExcel = [];
  const differences = [];
  const matched = [];
  
  // Check welke Excel klanten niet in database staan
  for (const excelKlant of excelKlanten) {
    const found = dbMembers.find(db => namesMatch(db.name, excelKlant.naam));
    
    if (!found) {
      missingInDb.push(excelKlant);
    } else {
      matched.push({ excel: excelKlant, db: found });
      
      // Check verschillen
      const diffs = [];
      if (excelKlant.email && found.email && normalizeName(excelKlant.email) !== normalizeName(found.email)) {
        diffs.push({ field: 'email', excel: excelKlant.email, db: found.email });
      }
      if (excelKlant.telefoon && found.phone && normalizeName(excelKlant.telefoon) !== normalizeName(found.phone)) {
        diffs.push({ field: 'telefoon', excel: excelKlant.telefoon, db: found.phone });
      }
      if (excelKlant.adres && found.adres && normalizeName(excelKlant.adres) !== normalizeName(found.adres)) {
        diffs.push({ field: 'adres', excel: excelKlant.adres, db: found.adres });
      }
      if (excelKlant.postcode && found.postcode && normalizeName(excelKlant.postcode) !== normalizeName(found.postcode)) {
        diffs.push({ field: 'postcode', excel: excelKlant.postcode, db: found.postcode });
      }
      if (excelKlant.plaats && found.plaats && normalizeName(excelKlant.plaats) !== normalizeName(found.plaats)) {
        diffs.push({ field: 'plaats', excel: excelKlant.plaats, db: found.plaats });
      }
      
      if (diffs.length > 0) {
        differences.push({ naam: excelKlant.naam, dbId: found.id, differences: diffs });
      }
    }
  }
  
  // Check welke database klanten niet in Excel staan
  for (const dbMember of dbMembers) {
    const found = excelKlanten.find(excel => namesMatch(excel.naam, dbMember.name));
    if (!found) {
      missingInExcel.push(dbMember);
    }
  }
  
  // Rapport
  console.log('📊 VERIFICATIE RESULTATEN\n');
  console.log('═'.repeat(60));
  
  console.log(`\n✅ GEVONDEN IN BEIDE:`);
  console.log(`   ${matched.length} klanten gevonden in beide bronnen`);
  
  if (missingInDb.length > 0) {
    console.log(`\n❌ ONTBREKEN IN DATABASE (${missingInDb.length}):`);
    missingInDb.forEach(klant => {
      console.log(`   - ${klant.naam}`);
    });
  }
  
  if (missingInExcel.length > 0) {
    console.log(`\n⚠️  ONTBREKEN IN EXCEL (${missingInExcel.length}):`);
    missingInExcel.forEach(klant => {
      console.log(`   - ${klant.name} (ID: ${klant.id})`);
    });
  }
  
  if (differences.length > 0) {
    console.log(`\n⚠️  VERSCHILLEN GEVONDEN (${differences.length}):`);
    differences.forEach(({ naam, differences: diffs }) => {
      console.log(`   ${naam}:`);
      diffs.forEach(diff => {
        console.log(`     - ${diff.field}: Excel="${diff.excel}" vs DB="${diff.db}"`);
      });
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // Genereer Excel rapport
  if (missingInDb.length > 0 || differences.length > 0) {
    console.log('\n📝 Excel rapport genereren...');
    
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Ontbrekend in database
    if (missingInDb.length > 0) {
      const missingData = [
        ['Voornaam', 'Achternaam', 'Volledige Naam', 'Adres', 'Postcode', 'Plaats', 'Telefoon', 'Email']
      ];
      missingInDb.forEach(klant => {
        missingData.push([
          klant.voornaam,
          klant.achternaam,
          klant.naam,
          klant.adres || '',
          klant.postcode || '',
          klant.plaats || '',
          klant.telefoon || '',
          klant.email || ''
        ]);
      });
      
      const ws1 = XLSX.utils.aoa_to_sheet(missingData);
      ws1['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 30 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Ontbrekend in DB');
    }
    
    // Sheet 2: Verschillen
    if (differences.length > 0) {
      const diffData = [
        ['Naam', 'Database ID', 'Veld', 'Excel Waarde', 'Database Waarde']
      ];
      differences.forEach(({ naam, dbId, differences: diffs }) => {
        diffs.forEach(diff => {
          diffData.push([naam, dbId, diff.field, diff.excel, diff.db]);
        });
      });
      
      const ws2 = XLSX.utils.aoa_to_sheet(diffData);
      ws2['!cols'] = [
        { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 30 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Verschillen');
    }
    
    const outputPath = 'Verificatie-Manege-Klanten.xlsx';
    XLSX.writeFile(wb, outputPath);
    console.log(`   ✅ Rapport opgeslagen: ${outputPath}`);
  }
  
  // Samenvatting
  console.log('\n📊 SAMENVATTING:');
  console.log(`   ✅ Correct: ${matched.length - differences.length}`);
  console.log(`   ❌ Ontbrekend in DB: ${missingInDb.length}`);
  console.log(`   ⚠️  Verschillen: ${differences.length}`);
  console.log(`   ⚠️  Ontbrekend in Excel: ${missingInExcel.length}`);
  
  if (missingInDb.length === 0 && differences.length === 0) {
    console.log('\n✨ Alle manege klanten zijn correct!');
  } else {
    console.log('\n⚠️  Er zijn verschillen gevonden. Bekijk het Excel rapport voor details.');
  }
}

verifyManegeKlanten().catch(error => {
  console.error('\n❌ Onverwachte fout:', error);
  process.exit(1);
});

