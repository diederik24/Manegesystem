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

async function checkParticipants() {
  console.log('\n🔍 Controleren welke deelnemers er zijn...\n');

  // Haal alle deelnemers op met gezinsleden
  const { data: participants, error: participantsError } = await supabase
    .from('lesson_participants')
    .select('recurring_lesson_id, member_id, family_member_id');

  if (participantsError) {
    console.error('❌ Fout:', participantsError);
    return;
  }

  // Haal lessen op
  const { data: lessons, error: lessonsError } = await supabase
    .from('recurring_lessons')
    .select('id, name, day_of_week, time, type')
    .order('day_of_week')
    .order('time');

  if (lessonsError) {
    console.error('❌ Fout:', lessonsError);
    return;
  }

  // Haal alle members op
  const memberIds = [...new Set(participants.map(p => p.member_id).filter(Boolean))];
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, klant_type')
    .in('id', memberIds);

  if (membersError) {
    console.error('❌ Fout:', membersError);
    return;
  }

  // Haal alle gezinsleden op
  const familyMemberIds = [...new Set(participants.map(p => p.family_member_id).filter(Boolean))];
  let familyMembers = [];
  if (familyMemberIds.length > 0) {
    const { data: fm, error: fmError } = await supabase
      .from('family_members')
      .select('id, name, member_id')
      .in('id', familyMemberIds);

    if (!fmError) {
      familyMembers = fm || [];
    }
  }

  const memberMap = {};
  members.forEach(m => {
    memberMap[m.id] = { name: m.name, type: m.klant_type };
  });

  const familyMap = {};
  familyMembers.forEach(fm => {
    familyMap[fm.id] = { name: fm.name, memberId: fm.member_id };
  });

  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  lessons.forEach(lesson => {
    const lesParticipants = participants.filter(p => p.recurring_lesson_id === lesson.id);
    const dayName = dayNames[lesson.day_of_week] || 'Onbekend';
    const time = lesson.time.substring(0, 5);

    console.log(`\n📅 ${dayName} ${time} - ${lesson.type}`);
    console.log(`   Les: ${lesson.name}`);
    console.log(`   Deelnemers (${lesParticipants.length}):`);

    if (lesParticipants.length === 0) {
      console.log(`   ⚠️  Geen deelnemers`);
    } else {
      lesParticipants.forEach((p, idx) => {
        if (p.family_member_id) {
          // Gezinslid
          const fm = familyMap[p.family_member_id];
          const member = memberMap[p.member_id];
          if (fm && member) {
            console.log(`      ${idx + 1}. 👨‍👩‍👧 ${fm.name} (gezinslid van ${member.name})`);
          } else {
            console.log(`      ${idx + 1}. ⚠️  Onbekend gezinslid ID: ${p.family_member_id}`);
          }
        } else {
          // Normale klant
          const member = memberMap[p.member_id];
          if (member) {
            const typeBadge = member.type === 'Pension' ? '🏠 Pension' : '🐴 Manege';
            console.log(`      ${idx + 1}. ${member.name} (${typeBadge})`);
          } else {
            console.log(`      ${idx + 1}. ⚠️  Onbekende klant ID: ${p.member_id}`);
          }
        }
      });
    }
    console.log('-'.repeat(70));
  });

  console.log(`\n✅ Totaal: ${lessons.length} lessen`);
  console.log(`✅ Totaal: ${participants.length} deelnemers gekoppeld\n`);
}

checkParticipants();

