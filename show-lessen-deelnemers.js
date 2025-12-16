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

async function showLessenEnDeelnemers() {
  console.log('\n📊 OVERZICHT: Welke klanten zitten in welke les?\n');
  console.log('='.repeat(70));
  
  // Haal lessen op
  const { data: lessons, error: lessonsError } = await supabase
    .from('recurring_lessons')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('time', { ascending: true });

  if (lessonsError) {
    console.error('❌ Fout bij ophalen lessen:', lessonsError);
    return;
  }

  // Haal alle deelnemers op
  const { data: participants, error: participantsError } = await supabase
    .from('lesson_participants')
    .select('recurring_lesson_id, member_id');

  if (participantsError) {
    console.error('❌ Fout bij ophalen deelnemers:', participantsError);
    return;
  }

  // Haal alle klanten op die deelnemen
  const memberIds = [...new Set(participants.map(p => p.member_id))];
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, klant_type')
    .in('id', memberIds);

  if (membersError) {
    console.error('❌ Fout bij ophalen klanten:', membersError);
    return;
  }

  // Maak maps
  const memberMap = {};
  members.forEach(m => {
    memberMap[m.id] = { name: m.name, type: m.klant_type };
  });

  const lessonParticipantsMap = {};
  participants.forEach(p => {
    if (!lessonParticipantsMap[p.recurring_lesson_id]) {
      lessonParticipantsMap[p.recurring_lesson_id] = [];
    }
    lessonParticipantsMap[p.recurring_lesson_id].push(p.member_id);
  });

  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  // Toon overzicht
  lessons.forEach((lesson, index) => {
    const dayName = dayNames[lesson.day_of_week] || 'Onbekend';
    const time = lesson.time.substring(0, 5);
    const deelnemerIds = lessonParticipantsMap[lesson.id] || [];
    
    console.log(`\n${index + 1}. 📅 ${dayName} ${time} - ${lesson.type}`);
    console.log(`   Les naam: ${lesson.name}`);
    
    if (deelnemerIds.length === 0) {
      console.log(`   ⚠️  Geen deelnemers`);
    } else {
      console.log(`   👥 Deelnemers (${deelnemerIds.length}):`);
      deelnemerIds.forEach((memberId, idx) => {
        const member = memberMap[memberId];
        if (member) {
          const typeBadge = member.type === 'Pension' ? '🏠 Pension' : '🐴 Manege';
          console.log(`      ${idx + 1}. ${member.name} (${typeBadge})`);
        } else {
          console.log(`      ⚠️  Onbekende klant ID: ${memberId}`);
        }
      });
    }
    console.log('-'.repeat(70));
  });

  console.log(`\n✅ Totaal: ${lessons.length} lessen`);
  console.log(`✅ Totaal: ${participants.length} deelnemers gekoppeld`);
  console.log(`✅ Totaal: ${members.length} unieke klanten\n`);
}

showLessenEnDeelnemers();

