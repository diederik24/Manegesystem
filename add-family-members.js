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

async function addFamilyMembers() {
  console.log('\n👨‍👩‍👧‍👦 Gezinsleden toevoegen...\n');

  // 1. Vind Moons Consolidated (hoofdklant voor Iris Moons)
  const { data: moonsConsolidated, error: moonsError } = await supabase
    .from('members')
    .select('id, name')
    .ilike('name', '%Moons%')
    .single();

  if (moonsError || !moonsConsolidated) {
    console.error('❌ Fout bij vinden Moons Consolidated:', moonsError?.message);
    return;
  }

  console.log(`✅ Gevonden hoofdklant: ${moonsConsolidated.name} (ID: ${moonsConsolidated.id})`);

  // 2. Vind Gisela Verduijn (hoofdklant voor Lotte Damen)
  const { data: gisela, error: giselaError } = await supabase
    .from('members')
    .select('id, name, klant_type')
    .ilike('name', '%Gisela%Verduijn%')
    .single();

  if (giselaError || !gisela) {
    console.error('❌ Fout bij vinden Gisela Verduijn:', giselaError?.message);
    return;
  }

  console.log(`✅ Gevonden hoofdklant: ${gisela.name} (ID: ${gisela.id}, Type: ${gisela.klant_type})`);

  // 3. Update Gisela Verduijn naar Pension klant
  if (gisela.klant_type !== 'Pension') {
    const { error: updateError } = await supabase
      .from('members')
      .update({ klant_type: 'Pension' })
      .eq('id', gisela.id);

    if (updateError) {
      console.error('❌ Fout bij updaten Gisela Verduijn:', updateError.message);
      return;
    }
    console.log(`✅ Gisela Verduijn geüpdatet naar Pension klant`);
  } else {
    console.log(`ℹ️  Gisela Verduijn is al Pension klant`);
  }

  // 4. Voeg Iris Moons toe als gezinslid van Moons Consolidated
  const { data: irisMoons, error: irisError } = await supabase
    .from('family_members')
    .select('id')
    .eq('member_id', moonsConsolidated.id)
    .ilike('name', '%Iris%Moons%')
    .single();

  if (irisError && irisError.code !== 'PGRST116') { // PGRST116 = not found, dat is ok
    console.error('❌ Fout bij checken Iris Moons:', irisError.message);
    return;
  }

  if (!irisMoons) {
    const { data: newIris, error: insertIrisError } = await supabase
      .from('family_members')
      .insert([{
        member_id: moonsConsolidated.id,
        name: 'Iris Moons',
        status: 'Actief'
      }])
      .select()
      .single();

    if (insertIrisError) {
      console.error('❌ Fout bij toevoegen Iris Moons:', insertIrisError.message);
      return;
    }
    console.log(`✅ Iris Moons toegevoegd als gezinslid van ${moonsConsolidated.name}`);
  } else {
    console.log(`ℹ️  Iris Moons bestaat al als gezinslid`);
  }

  // 5. Voeg Lotte Damen toe als gezinslid van Gisela Verduijn
  const { data: lotteDamen, error: lotteError } = await supabase
    .from('family_members')
    .select('id')
    .eq('member_id', gisela.id)
    .ilike('name', '%Lotte%Damen%')
    .single();

  if (lotteError && lotteError.code !== 'PGRST116') {
    console.error('❌ Fout bij checken Lotte Damen:', lotteError.message);
    return;
  }

  if (!lotteDamen) {
    const { data: newLotte, error: insertLotteError } = await supabase
      .from('family_members')
      .insert([{
        member_id: gisela.id,
        name: 'Lotte Damen',
        status: 'Actief'
      }])
      .select()
      .single();

    if (insertLotteError) {
      console.error('❌ Fout bij toevoegen Lotte Damen:', insertLotteError.message);
      return;
    }
    console.log(`✅ Lotte Damen toegevoegd als gezinslid van ${gisela.name}`);
  } else {
    console.log(`ℹ️  Lotte Damen bestaat al als gezinslid`);
  }

  console.log('\n✅ Klaar! Gezinsleden zijn toegevoegd.\n');
}

addFamilyMembers();

