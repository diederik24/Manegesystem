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
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lees Excel bestand
console.log('📖 Excel bestand lezen...');
const workbook = XLSX.readFile('Pension Klanten bestand 2025.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Parse klanten en paarden uit Excel
const klantPaardMap = {};

for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row || !row[0]) continue;
  
  const voornaam = row[0]?.toString().trim() || '';
  const achternaam = row[2]?.toString().trim() || '';
  const paard = row[17]?.toString().trim() || '';
  
  if (voornaam || achternaam) {
    const naam = `${voornaam} ${achternaam}`.trim();
    if (paard) {
      const paardNamen = paard.split('/').map(p => p.trim()).filter(p => p);
      klantPaardMap[naam] = paardNamen;
    }
  }
}

console.log(`✅ ${Object.keys(klantPaardMap).length} klanten met paarden gevonden\n`);

// Fix de owner_id voor alle paarden
async function fixHorseOwners() {
  console.log('🔧 Paarden koppelen aan eigenaren...\n');
  
  const results = {
    success: 0,
    errors: 0,
    notFound: 0
  };
  
  // Haal alle members op
  const { data: allMembers } = await supabase
    .from('members')
    .select('id, name')
    .eq('klant_type', 'Pension');
  
  if (!allMembers) {
    console.error('❌ Kon geen members ophalen');
    return;
  }
  
  // Maak een map van naam naar member ID (case-insensitive)
  const memberMap = {};
  allMembers.forEach(m => {
    memberMap[m.name.toLowerCase()] = m.id;
  });
  
  // Loop door alle klanten uit Excel
  for (const [klantNaam, paardNamen] of Object.entries(klantPaardMap)) {
    const memberId = memberMap[klantNaam.toLowerCase()];
    
    if (!memberId) {
      console.log(`⚠️  Klant niet gevonden: ${klantNaam}`);
      results.notFound++;
      continue;
    }
    
    // Koppel elk paard aan deze klant
    for (const paardNaam of paardNamen) {
      // Zoek het paard op naam
      const { data: horses } = await supabase
        .from('horses')
        .select('id, name, owner_id')
        .ilike('name', paardNaam);
      
      if (!horses || horses.length === 0) {
        console.log(`⚠️  Paard niet gevonden: ${paardNaam} (${klantNaam})`);
        results.notFound++;
        continue;
      }
      
      // Update het eerste gevonden paard (als er meerdere zijn met dezelfde naam)
      const horse = horses[0];
      
      if (horse.owner_id === memberId) {
        console.log(`⏭️  Paard al gekoppeld: ${paardNaam} → ${klantNaam}`);
        continue;
      }
      
      const { error } = await supabase
        .from('horses')
        .update({ owner_id: memberId })
        .eq('id', horse.id);
      
      if (error) {
        console.error(`❌ Fout bij koppelen ${paardNaam} → ${klantNaam}:`, error.message);
        results.errors++;
      } else {
        console.log(`✓ Gekoppeld: ${paardNaam} → ${klantNaam}`);
        results.success++;
      }
    }
  }
  
  console.log(`\n📊 Resultaat:`);
  console.log(`   ✓ Success: ${results.success}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log(`   ⚠️  Not Found: ${results.notFound}`);
}

fixHorseOwners();

