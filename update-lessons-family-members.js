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

async function updateLessonsWithFamilyMembers() {
  console.log('\n🔄 Lessen updaten met gezinsleden...\n');

  // 1. Vind Iris Moons (gezinslid)
  const { data: irisMoons, error: irisError } = await supabase
    .from('family_members')
    .select('id, name, member_id')
    .ilike('name', '%Iris%Moons%')
    .single();

  if (irisError || !irisMoons) {
    console.error('❌ Fout bij vinden Iris Moons:', irisError?.message);
    return;
  }

  console.log(`✅ Gevonden gezinslid: ${irisMoons.name} (ID: ${irisMoons.id})`);

  // 2. Vind Lotte Damen (gezinslid)
  const { data: lotteDamen, error: lotteError } = await supabase
    .from('family_members')
    .select('id, name, member_id')
    .ilike('name', '%Lotte%Damen%')
    .single();

  if (lotteError || !lotteDamen) {
    console.error('❌ Fout bij vinden Lotte Damen:', lotteError?.message);
    return;
  }

  console.log(`✅ Gevonden gezinslid: ${lotteDamen.name} (ID: ${lotteDamen.id})`);

  // 3. Vind de les "Dinsdag 19:30 Pensionles"
  const { data: pensionles, error: lesError } = await supabase
    .from('recurring_lessons')
    .select('id, name')
    .ilike('name', '%Dinsdag%19:30%Pensionles%')
    .single();

  if (lesError || !pensionles) {
    console.error('❌ Fout bij vinden Dinsdag 19:30 Pensionles:', lesError?.message);
    return;
  }

  console.log(`✅ Gevonden les: ${pensionles.name} (ID: ${pensionles.id})`);

  // 4. Vind de les "Donderdag 19:00 Groepsles" (waar Lotte Damen in moet)
  const { data: donderdagLes, error: donderdagError } = await supabase
    .from('recurring_lessons')
    .select('id, name')
    .ilike('name', '%Donderdag%19:00%Groepsles%')
    .single();

  if (donderdagError || !donderdagLes) {
    console.error('❌ Fout bij vinden Donderdag 19:00 Groepsles:', donderdagError?.message);
    return;
  }

  console.log(`✅ Gevonden les: ${donderdagLes.name} (ID: ${donderdagLes.id})`);

  // 5. Verwijder oude deelnemer "Moons Consolidated" uit de pensionles (als die er is)
  // en voeg Iris Moons toe als gezinslid
  const { data: existingParticipants, error: participantsError } = await supabase
    .from('lesson_participants')
    .select('id, member_id, family_member_id')
    .eq('recurring_lesson_id', pensionles.id);

  if (participantsError) {
    console.error('❌ Fout bij ophalen deelnemers:', participantsError.message);
    return;
  }

  // Check of Moons Consolidated al in de les zit
  const moonsConsolidatedParticipant = existingParticipants.find(p => 
    p.member_id === irisMoons.member_id && !p.family_member_id
  );

  if (moonsConsolidatedParticipant) {
    // Update naar Iris Moons als gezinslid
    const { error: updateError } = await supabase
      .from('lesson_participants')
      .update({ 
        family_member_id: irisMoons.id,
        member_id: irisMoons.member_id // Blijf de hoofdklant koppelen voor facturatie
      })
      .eq('id', moonsConsolidatedParticipant.id);

    if (updateError) {
      console.error('❌ Fout bij updaten naar Iris Moons:', updateError.message);
      return;
    }
    console.log(`✅ Moons Consolidated vervangen door Iris Moons (gezinslid) in ${pensionles.name}`);
  } else {
    // Check of Iris Moons al in de les zit
    const irisAlreadyIn = existingParticipants.find(p => p.family_member_id === irisMoons.id);
    if (!irisAlreadyIn) {
      // Voeg Iris Moons toe
      const { error: insertError } = await supabase
        .from('lesson_participants')
        .insert([{
          recurring_lesson_id: pensionles.id,
          member_id: irisMoons.member_id, // Hoofdklant voor facturatie
          family_member_id: irisMoons.id // Gezinslid die deelneemt
        }]);

      if (insertError) {
        console.error('❌ Fout bij toevoegen Iris Moons:', insertError.message);
        return;
      }
      console.log(`✅ Iris Moons toegevoegd aan ${pensionles.name}`);
    } else {
      console.log(`ℹ️  Iris Moons zit al in ${pensionles.name}`);
    }
  }

  // 6. Voeg Lotte Damen toe aan Donderdag 19:00 Groepsles
  const { data: donderdagParticipants, error: donderdagParticipantsError } = await supabase
    .from('lesson_participants')
    .select('id, member_id, family_member_id')
    .eq('recurring_lesson_id', donderdagLes.id);

  if (donderdagParticipantsError) {
    console.error('❌ Fout bij ophalen deelnemers:', donderdagParticipantsError.message);
    return;
  }

  // Check of Lotte Damen al in de les zit
  const lotteAlreadyIn = donderdagParticipants.find(p => p.family_member_id === lotteDamen.id);
  if (!lotteAlreadyIn) {
    // Check of Gisela Verduijn al in de les zit (moeten we vervangen?)
    const giselaInLes = donderdagParticipants.find(p => 
      p.member_id === lotteDamen.member_id && !p.family_member_id
    );

    if (giselaInLes) {
      // Update naar Lotte Damen als gezinslid
      const { error: updateError } = await supabase
        .from('lesson_participants')
        .update({ 
          family_member_id: lotteDamen.id,
          member_id: lotteDamen.member_id
        })
        .eq('id', giselaInLes.id);

      if (updateError) {
        console.error('❌ Fout bij updaten naar Lotte Damen:', updateError.message);
        return;
      }
      console.log(`✅ Gisela Verduijn vervangen door Lotte Damen (gezinslid) in ${donderdagLes.name}`);
    } else {
      // Voeg Lotte Damen toe
      const { error: insertError } = await supabase
        .from('lesson_participants')
        .insert([{
          recurring_lesson_id: donderdagLes.id,
          member_id: lotteDamen.member_id,
          family_member_id: lotteDamen.id
        }]);

      if (insertError) {
        console.error('❌ Fout bij toevoegen Lotte Damen:', insertError.message);
        return;
      }
      console.log(`✅ Lotte Damen toegevoegd aan ${donderdagLes.name}`);
    }
  } else {
    console.log(`ℹ️  Lotte Damen zit al in ${donderdagLes.name}`);
  }

  console.log('\n✅ Klaar! Lessen zijn geüpdatet met gezinsleden.\n');
}

updateLessonsWithFamilyMembers();

