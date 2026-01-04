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

// Helper functie om klant te vinden met fuzzy matching
function findMemberId(members, naam) {
  const normalizedNaam = naam.toLowerCase().trim();
  
  // Directe match
  for (const member of members) {
    const memberName = member.name.toLowerCase().trim();
    if (memberName === normalizedNaam) {
      return member.id;
    }
  }
  
  // Fuzzy match - probeer gedeeltelijke match
  for (const member of members) {
    const memberName = member.name.toLowerCase().trim();
    if (memberName.includes(normalizedNaam) || normalizedNaam.includes(memberName)) {
      return member.id;
    }
  }
  
  return null;
}

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

async function updateLeskaarten() {
  const excelPath = 'Klanten bestand 4-1-2026.xlsx';
  
  console.log(`\n📖 Excel bestand lezen: ${excelPath}...`);
  
  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (error) {
    console.error(`❌ Kan Excel bestand niet lezen: ${error.message}`);
    console.log(`   Zorg dat het bestand bestaat op: ${excelPath}`);
    process.exit(1);
  }
  
  // Toon alle beschikbare sheets
  console.log(`\n📑 Beschikbare sheets: ${workbook.SheetNames.join(', ')}`);
  
  // Zoek naar sheet met leskaart data (zoek naar "Duur leskaart" of "Totaal geboekt")
  let worksheet = null;
  let sheetName = null;
  
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    // Zoek naar header met "Duur leskaart" of "Totaal geboekt"
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i];
      if (row && Array.isArray(row)) {
        const rowString = row.join(' ').toLowerCase();
        if (rowString.includes('duur leskaart') || rowString.includes('totaal geboekt') || rowString.includes('totaal tegoed')) {
          worksheet = sheet;
          sheetName = name;
          console.log(`✅ Leskaart data gevonden in sheet: "${name}"`);
          break;
        }
      }
    }
    if (worksheet) break;
  }
  
  if (!worksheet) {
    console.log('⚠️  Geen leskaart data gevonden, gebruik eerste sheet');
    sheetName = workbook.SheetNames[0];
    worksheet = workbook.Sheets[sheetName];
  }
  
  // Lees raw data
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  
  // Vind header rij (zoek naar rij met "Voornaam" EN "Duur leskaart" of "Totaal geboekt")
  let headerRowIndex = -1;
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const rowString = row.join(' ').toLowerCase();
      if (rowString.includes('voornaam') && 
          (rowString.includes('duur leskaart') || rowString.includes('totaal geboekt') || rowString.includes('totaal tegoed'))) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex >= 0) {
    console.log(`✅ Header rij gevonden op rij ${headerRowIndex + 1}`);
  } else {
    console.log('⚠️  Geen header rij gevonden met leskaart data, start vanaf eerste rij');
  }
  
  // Kolom mapping volgens specificatie:
  // A=0: Voornaam, B=1: Achternaam, C=2: Duur leskaart (begin/eind), D=3: Totaal geboekt (gereden), E=4: Totaal tegoed (nog over)
  const columns = {
    voornaam: 0,           // Kolom A
    achternaam: 1,         // Kolom B
    duur: 2,               // Kolom C (bijv. "12-12-25 / 13-03-2026")
    gebruikteLessen: 3,     // Kolom D (Totaal geboekt)
    resterendeLessen: 4    // Kolom E (Totaal tegoed)
  };
  
  console.log('\n📋 Kolom mapping:');
  console.log('   A (0): Voornaam');
  console.log('   B (1): Achternaam');
  console.log('   C (2): Duur leskaart (begin/eind datum)');
  console.log('   D (3): Totaal geboekt (gereden)');
  console.log('   E (4): Totaal tegoed (nog over)');
  
  // Toon eerste paar data rijen om structuur te zien
  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  console.log('\n📋 Eerste 5 rijen (inclusief header):');
  for (let i = Math.max(0, headerRowIndex - 1); i < Math.min(startRow + 5, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      console.log(`Rij ${i + 1} (volledige rij):`, row);
      console.log(`   Kolom A (0): "${row[0]}"`);
      console.log(`   Kolom B (1): "${row[1]}"`);
      console.log(`   Kolom C (2): "${row[2]}"`);
      console.log(`   Kolom D (3): "${row[3]}"`);
      console.log(`   Kolom E (4): "${row[4]}"`);
      console.log('');
    }
  }
  
  // Haal alle klanten op
  console.log('\n👥 Klanten ophalen uit database...');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name')
    .in('klant_type', ['Manege', 'Pension'])
    .eq('status', 'Actief');
  
  if (membersError) {
    console.error('❌ Fout bij ophalen klanten:', membersError);
    process.exit(1);
  }
  
  console.log(`✅ ${members.length} actieve klanten gevonden\n`);
  
  // Parse data (start na header rij, of vanaf rij 0 als geen header)
  const leskaarten = [];
  const errors = [];
  
  console.log(`\n📊 Data rijen verwerken vanaf rij ${startRow + 1}...\n`);
  
  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    
    if (!row || row.length === 0) {
      continue;
    }
    
    // Haal naam op (kolom A en B)
    const voornaam = row[columns.voornaam]?.toString().trim() || '';
    const achternaam = row[columns.achternaam]?.toString().trim() || '';
    const naam = `${voornaam} ${achternaam}`.trim();
    
    if (!naam || !voornaam) {
      continue;
    }
    
    // Haal leskaart data op
    const gebruikteLessen = parseInt(row[columns.gebruikteLessen]) || 0;
    const resterendeLessen = parseInt(row[columns.resterendeLessen]) || 0;
    const totaalLessen = gebruikteLessen + resterendeLessen;
    
    // Parse duur leskaart (kolom C) - bijv. "12-12-25 / 13-03-2026"
    const duurString = row[columns.duur]?.toString().trim() || '';
    const datumRange = parseDatumRange(duurString);
    
    if (!datumRange) {
      errors.push({
        naam,
        reden: `Kon datum range niet parsen: "${duurString}"`
      });
      continue;
    }
    
    // Vind klant
    const klantId = findMemberId(members, naam);
    if (!klantId) {
      errors.push({
        naam,
        reden: 'Klant niet gevonden in database'
      });
      continue;
    }
    
    const status = resterendeLessen > 0 ? 'actief' : 'opgebruikt';
    
    leskaarten.push({
      klantId,
      naam,
      totaalLessen,
      gebruikteLessen,
      resterendeLessen,
      startDatum: datumRange.start,
      eindDatum: datumRange.end,
      status
    });
  }
  
  console.log(`\n✅ ${leskaarten.length} leskaarten gevonden om te updaten\n`);
  
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} fouten gevonden:\n`);
    errors.forEach(err => {
      console.log(`   - ${err.naam}: ${err.reden}`);
    });
    console.log('');
  }
  
  // Update leskaarten
  console.log('📤 Leskaarten updaten in Supabase...\n');
  
  const results = {
    created: 0,
    updated: 0,
    errors: 0
  };
  
  for (const leskaart of leskaarten) {
    try {
      // Check of er al een actieve leskaart bestaat voor deze klant
      const { data: existing, error: checkError } = await supabase
        .from('leskaarten')
        .select('id')
        .eq('klant_id', leskaart.klantId)
        .eq('status', 'actief')
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`⚠️  Fout bij checken ${leskaart.naam}:`, checkError.message);
        results.errors++;
        continue;
      }
      
      if (existing) {
        // Update bestaande leskaart
        const { error: updateError } = await supabase
          .from('leskaarten')
          .update({
            totaal_lessen: leskaart.totaalLessen,
            gebruikte_lessen: leskaart.gebruikteLessen,
            resterende_lessen: leskaart.resterendeLessen,
            start_datum: leskaart.startDatum,
            eind_datum: leskaart.eindDatum,
            status: leskaart.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`⚠️  Fout bij updaten ${leskaart.naam}:`, updateError.message);
          results.errors++;
        } else {
          results.updated++;
          console.log(`✓ Updated: ${leskaart.naam} (${leskaart.gebruikteLessen} gebruikt, ${leskaart.resterendeLessen} over, geldig tot ${leskaart.eindDatum})`);
        }
      } else {
        // Nieuwe leskaart aanmaken
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
          console.error(`⚠️  Fout bij aanmaken ${leskaart.naam}:`, insertError.message);
          results.errors++;
        } else {
          results.created++;
          console.log(`✓ Created: ${leskaart.naam} (${leskaart.gebruikteLessen} gebruikt, ${leskaart.resterendeLessen} over, geldig tot ${leskaart.eindDatum})`);
        }
      }
    } catch (error) {
      console.error(`❌ Fout bij ${leskaart.naam}:`, error.message);
      results.errors++;
    }
  }
  
      console.log(`\n📊 Update resultaat:`);
      console.log(`   ✓ Nieuwe leskaarten: ${results.created}`);
      console.log(`   ✓ Geüpdatete leskaarten: ${results.updated}`);
      console.log(`   ❌ Errors: ${results.errors}`);
      
      // Genereer Excel bestand met niet-gevonden namen
      if (errors.length > 0) {
        console.log('\n📝 Excel bestand genereren met niet-gevonden namen...');
        generateNotFoundExcel(errors);
      }
      
      console.log('\n✅ Update voltooid!');
    }

    function generateNotFoundExcel(errors) {
      // Filter alleen de "Klant niet gevonden" errors
      const notFoundErrors = errors.filter(err => err.reden === 'Klant niet gevonden in database');
      
      if (notFoundErrors.length === 0) {
        console.log('   Geen klanten die niet gevonden zijn.');
        return;
      }
      
      // Maak data array voor Excel
      const excelData = [
        ['Voornaam', 'Achternaam', 'Volledige Naam', 'Reden']
      ];
      
      notFoundErrors.forEach(err => {
        const voornaam = err.voornaam || (err.naam ? err.naam.split(' ')[0] : '');
        const achternaam = err.achternaam || (err.naam ? err.naam.split(' ').slice(1).join(' ') : '');
        excelData.push([voornaam, achternaam, err.naam, err.reden]);
      });
      
      // Maak workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Stel kolom breedtes in
      ws['!cols'] = [
        { wch: 20 }, // Voornaam
        { wch: 25 }, // Achternaam
        { wch: 30 }, // Volledige Naam
        { wch: 30 }  // Reden
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Niet Gevonden Klanten');
      
      // Schrijf naar bestand
      const outputPath = 'Niet-gevonden-klanten.xlsx';
      XLSX.writeFile(wb, outputPath);
      
      console.log(`   ✅ Excel bestand aangemaakt: ${outputPath}`);
      console.log(`   📋 ${notFoundErrors.length} klanten niet gevonden in database`);
    }

    updateLeskaarten().catch(error => {
      console.error('\n❌ Onverwachte fout:', error);
      process.exit(1);
    });

