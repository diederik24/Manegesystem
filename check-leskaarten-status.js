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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkLeskaartenStatus() {
  console.log('\n📊 Leskaarten status overzicht\n');
  console.log('='.repeat(50));
  
  const { data: leskaarten, error } = await supabase
    .from('leskaarten')
    .select('id, status, resterende_lessen, eind_datum');
  
  if (error) {
    console.error('❌ Fout:', error);
    return;
  }
  
  const nu = new Date();
  
  const actief = leskaarten.filter(l => 
    l.status === 'actief' && 
    l.resterende_lessen > 0 &&
    new Date(l.eind_datum) >= nu
  ).length;
  
  const opgebruikt = leskaarten.filter(l => 
    l.status === 'opgebruikt' || 
    l.resterende_lessen === 0
  ).length;
  
  const verlopen = leskaarten.filter(l => 
    l.status === 'verlopen' ||
    (l.status === 'actief' && new Date(l.eind_datum) < nu)
  ).length;
  
  console.log(`\n📈 Totaal leskaarten: ${leskaarten.length}`);
  console.log(`✅ Actief: ${actief}`);
  console.log(`🔴 Opgebruikt: ${opgebruikt}`);
  console.log(`⏰ Verlopen: ${verlopen}\n`);
  console.log('='.repeat(50));
}

checkLeskaartenStatus();

