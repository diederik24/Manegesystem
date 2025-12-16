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

async function fixGisela() {
  console.log('\n🔧 Gisela Verduijn updaten naar Pension...\n');

  // Vind Gisela Verduijn
  const { data: gisela, error: findError } = await supabase
    .from('members')
    .select('id, name, klant_type')
    .ilike('name', '%Gisela%Verduijn%')
    .single();

  if (findError || !gisela) {
    console.error('❌ Fout bij vinden Gisela Verduijn:', findError?.message);
    return;
  }

  console.log(`Gevonden: ${gisela.name} (Huidig type: ${gisela.klant_type})`);

  // Update naar Pension
  const { error: updateError } = await supabase
    .from('members')
    .update({ klant_type: 'Pension' })
    .eq('id', gisela.id);

  if (updateError) {
    console.error('❌ Fout bij updaten:', updateError.message);
    return;
  }

  console.log('✅ Gisela Verduijn succesvol geüpdatet naar Pension klant!\n');
}

fixGisela();

