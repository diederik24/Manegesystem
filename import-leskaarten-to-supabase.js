import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Lees environment variabelen
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
  console.error('\n❌ Supabase credentials niet gevonden!');
  console.log('Zorg dat je .env.local of .env bestand hebt met:');
  console.log('VITE_SUPABASE_URL=...');
  console.log('SUPABASE_SERVICE_ROLE_KEY=...\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse datum string (bijv. "12-12-25 / 13-03-2026" of "12-12-2025 / 13-03-2026")
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

// Helper functie om klant te vinden met fuzzy matching
function findMemberId(members, voornaam, achternaam) {
  const normalizedVoornaam = voornaam.toLowerCase().trim();
  const normalizedAchternaam = achternaam.toLowerCase().trim();
  const fullName = `${normalizedVoornaam} ${normalizedAchternaam}`;
  
  // Directe match
  for (const member of members) {
    const memberName = member.name.toLowerCase().trim();
    if (memberName === fullName) {
      return member.id;
    }
    
    // Match op voornaam + achternaam (zonder tussenvoegsels)
    const memberParts = memberName.split(' ');
    if (memberParts.length >= 2) {
      const memberVoornaam = memberParts[0];
      const memberAchternaam = memberParts[memberParts.length - 1];
      if (memberVoornaam === normalizedVoornaam && memberAchternaam === normalizedAchternaam) {
        return member.id;
      }
    }
  }
  
  // Fuzzy match - probeer gedeeltelijke match
  for (const member of members) {
    const memberName = member.name.toLowerCase().trim();
    if (memberName.includes(normalizedVoornaam) && memberName.includes(normalizedAchternaam)) {
      return member.id;
    }
  }
  
  return null;
}

async function importLeskaarten() {
  console.log('\n📖 Excel bestand lezen: Les Kaarten.xlsx...');
  
  const workbook = XLSX.readFile('Les Kaarten.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Lees data als array van arrays (raw data)
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  
  // Vind header rij (rij met "Voornaam", "Achternaam", etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row && row.length > 0 && typeof row[0] === 'string' && row[0].toLowerCase().includes('voornaam')) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.error('❌ Header rij niet gevonden!');
    process.exit(1);
  }
  
  const headers = rawData[headerRowIndex];
  console.log('Headers gevonden:', headers);
  
  // Vind kolom indices
  const voornaamIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('voornaam'));
  const achternaamIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('achternaam'));
  const duurIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('duur'));
  const geboektIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('geboekt'));
  const tegoedIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('tegoed'));
  
  console.log('\nKolom indices:');
  console.log(`  Voornaam: ${voornaamIndex}`);
  console.log(`  Achternaam: ${achternaamIndex}`);
  console.log(`  Duur: ${duurIndex}`);
  console.log(`  Geboekt: ${geboektIndex}`);
  console.log(`  Tegoed: ${tegoedIndex}\n`);
  
  if (voornaamIndex === -1 || achternaamIndex === -1 || duurIndex === -1 || geboektIndex === -1 || tegoedIndex === -1) {
    console.error('❌ Niet alle vereiste kolommen gevonden!');
    process.exit(1);
  }
  
  // Haal alle klanten op
  console.log('👥 Klanten ophalen uit database...');
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
  
  // Parse data rijen
  const leskaarten = [];
  const errors = [];
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip lege rijen
    if (!row || row.length === 0 || !row[voornaamIndex]) {
      continue;
    }
    
    const voornaam = row[voornaamIndex]?.toString().trim();
    const achternaam = row[achternaamIndex]?.toString().trim();
    const duurString = row[duurIndex]?.toString().trim();
    const totaalGeboekt = parseInt(row[geboektIndex]) || 0;
    const totaalTegoed = parseInt(row[tegoedIndex]) || 0;
    
    if (!voornaam || !achternaam) {
      continue;
    }
    
    // Parse datum range
    const datumRange = parseDatumRange(duurString);
    if (!datumRange) {
      errors.push({
        naam: `${voornaam} ${achternaam}`,
        reden: `Kon datum niet parsen: "${duurString}"`
      });
      continue;
    }
    
    // Vind klant
    const klantId = findMemberId(members, voornaam, achternaam);
    if (!klantId) {
      errors.push({
        naam: `${voornaam} ${achternaam}`,
        reden: 'Klant niet gevonden in database'
      });
      continue;
    }
    
    const totaalLessen = totaalGeboekt + totaalTegoed;
    const status = totaalTegoed > 0 ? 'actief' : 'opgebruikt';
    
    leskaarten.push({
      klantId,
      voornaam,
      achternaam,
      totaalLessen,
      gebruikteLessen: totaalGeboekt,
      resterendeLessen: totaalTegoed,
      startDatum: datumRange.start,
      eindDatum: datumRange.end,
      status
    });
  }
  
  console.log(`\n✅ ${leskaarten.length} leskaarten gevonden om te importeren\n`);
  
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} fouten gevonden:\n`);
    errors.forEach(err => {
      console.log(`   - ${err.naam}: ${err.reden}`);
    });
    console.log('');
  }
  
  // Test database connectie
  console.log('🔌 Testen database connectie...');
  const { error: testError } = await supabase
    .from('leskaarten')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('❌ Database connectie fout:', testError.message);
    console.log('\nZorg dat je eerst de migration uitvoert: database-migration-leskaarten.sql');
    process.exit(1);
  }
  
  console.log('✅ Database connectie succesvol!\n');
  
  // Importeer leskaarten
  console.log('📤 Leskaarten importeren naar Supabase...\n');
  
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
        console.error(`⚠️  Fout bij checken ${leskaart.voornaam} ${leskaart.achternaam}:`, checkError.message);
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
          console.error(`⚠️  Fout bij updaten ${leskaart.voornaam} ${leskaart.achternaam}:`, updateError.message);
          results.errors++;
        } else {
          results.updated++;
          console.log(`✓ Updated: ${leskaart.voornaam} ${leskaart.achternaam} (${leskaart.gebruikteLessen}/${leskaart.totaalLessen} lessen)`);
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
          console.error(`⚠️  Fout bij aanmaken ${leskaart.voornaam} ${leskaart.achternaam}:`, insertError.message);
          results.errors++;
        } else {
          results.created++;
          console.log(`✓ Created: ${leskaart.voornaam} ${leskaart.achternaam} (${leskaart.gebruikteLessen}/${leskaart.totaalLessen} lessen)`);
        }
      }
    } catch (error) {
      console.error(`❌ Fout bij ${leskaart.voornaam} ${leskaart.achternaam}:`, error.message);
      results.errors++;
    }
  }
  
  console.log(`\n📊 Import resultaat:`);
  console.log(`   ✓ Nieuwe leskaarten: ${results.created}`);
  console.log(`   ✓ Geüpdatete leskaarten: ${results.updated}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log('\n✅ Import voltooid!');
}

importLeskaarten().catch(error => {
  console.error('\n❌ Onverwachte fout:', error);
  process.exit(1);
});

