import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Helper functie om input te vragen
function askQuestion(query) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Converteer dag naam naar dag nummer (0 = Maandag, 6 = Zondag)
function dayNameToNumber(dayName) {
  const days = {
    'maandag': 0,
    'dinsdag': 1,
    'woensdag': 2,
    'donderdag': 3,
    'vrijdag': 4,
    'zaterdag': 5,
    'zondag': 6
  };
  return days[dayName.toLowerCase().trim()] ?? -1;
}

// Parse les tijd en type uit string (bijv. "19:00-19:30 Priveles")
function parseLesInfo(lesString) {
  if (!lesString || typeof lesString !== 'string') return null;
  
  const trimmed = lesString.trim();
  if (!trimmed) return null;
  
  // Extract tijd (HH:MM of HH:MM-HH:MM)
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?:-(\d{1,2}):(\d{2}))?/);
  if (!timeMatch) return null;
  
  const startHour = parseInt(timeMatch[1]);
  const startMin = parseInt(timeMatch[2]);
  const endHour = timeMatch[3] ? parseInt(timeMatch[3]) : null;
  const endMin = timeMatch[4] ? parseInt(timeMatch[4]) : null;
  
  // Bereken duur
  let duration = 60; // Standaard 60 minuten
  if (endHour !== null && endMin !== null) {
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    duration = endMinutes - startMinutes;
  }
  
  // Extract type
  let type = 'Groepsles';
  const lower = trimmed.toLowerCase();
  if (lower.includes('priveles') || lower.includes('privéles')) {
    type = 'Privéles';
  } else if (lower.includes('pensionles') || lower.includes('pension les')) {
    type = 'Pensionles';
  } else if (lower.includes('groepsles') || lower.includes('groep')) {
    type = 'Groepsles';
  } else if (lower.includes('buitenrit')) {
    type = 'Buitenrit';
  }
  
  return {
    time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
    duration: duration,
    type: type,
    originalString: trimmed
  };
}

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
  console.log('\n📝 Supabase credentials nodig voor import\n');
  (async () => {
    if (!supabaseUrl) supabaseUrl = await askQuestion('Voer je Supabase URL in: ');
    if (!supabaseServiceKey) supabaseServiceKey = await askQuestion('Voer je Supabase Service Role Key in: ');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('\n❌ Beide credentials zijn verplicht!');
      process.exit(1);
    }
    await runImport();
  })();
} else {
  runImport();
}

async function runImport() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n📖 Excel bestand lezen: Les_Groepen.xlsx...');
  const workbook = XLSX.readFile('Les_Groepen.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

  // Vind dag kolommen
  const headers = data[0] || [];
  const dayColumns = {};
  
  headers.forEach((header, colIndex) => {
    if (header && typeof header === 'string') {
      const dayName = header.toLowerCase().trim();
      if (dayName.includes('maandag')) dayColumns['Maandag'] = colIndex;
      if (dayName.includes('dinsdag')) dayColumns['Dinsdag'] = colIndex;
      if (dayName.includes('woensdag')) dayColumns['Woensdag'] = colIndex;
      if (dayName.includes('donderdag')) dayColumns['Donderdag'] = colIndex;
      if (dayName.includes('vrijdag')) dayColumns['Vrijdag'] = colIndex;
      if (dayName.includes('zaterdag')) dayColumns['Zaterdag'] = colIndex;
      if (dayName.includes('zondag')) dayColumns['Zondag'] = colIndex;
    }
  });

  console.log('Gevonden dag kolommen:', dayColumns);

  // Haal alle klanten op voor matching
  console.log('\n👥 Klanten ophalen uit database...');
  const { data: allMembers, error: membersError } = await supabase
    .from('members')
    .select('id, name, klant_type')
    .in('klant_type', ['Manege', 'Pension']);

  if (membersError) {
    console.error('❌ Fout bij ophalen klanten:', membersError.message);
    process.exit(1);
  }

  console.log(`✅ ${allMembers.length} klanten gevonden`);

  // Maak een map van naam naar member ID (case-insensitive)
  // Met verschillende variaties voor betere matching
  const memberMap = {};
  const memberNameVariations = {}; // Voor fuzzy matching
  
  allMembers.forEach(member => {
    const normalizedName = member.name.toLowerCase().trim();
    memberMap[normalizedName] = member.id;
    
    // Maak verschillende variaties
    const nameParts = normalizedName.split(' ').filter(p => p);
    
    // Volledige naam
    memberMap[normalizedName] = member.id;
    
    // Alleen voornaam
    if (nameParts.length > 0) {
      const firstName = nameParts[0];
      if (!memberMap[firstName]) {
        memberMap[firstName] = member.id;
      }
      memberNameVariations[firstName] = member.id;
    }
    
    // Voornaam + achternaam (zonder tussenvoegsels)
    if (nameParts.length > 1) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const shortName = `${firstName} ${lastName}`;
      if (!memberMap[shortName]) {
        memberMap[shortName] = member.id;
      }
    }
    
    // Namen zonder accenten (Loïs -> Lois)
    const nameWithoutAccents = normalizedName
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c');
    if (nameWithoutAccents !== normalizedName) {
      memberMap[nameWithoutAccents] = member.id;
    }
  });
  
  // Helper functie om klant te vinden met fuzzy matching
  function findMemberId(searchName) {
    const normalized = searchName.toLowerCase().trim();
    
    // Directe match
    if (memberMap[normalized]) {
      return memberMap[normalized];
    }
    
    // Zonder accenten
    const withoutAccents = normalized
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c');
    if (memberMap[withoutAccents]) {
      return memberMap[withoutAccents];
    }
    
    // Probeer op voornaam
    const firstName = normalized.split(' ')[0];
    if (memberNameVariations[firstName]) {
      return memberNameVariations[firstName];
    }
    
    // Probeer op gedeeltelijke match (bevat)
    for (const [name, id] of Object.entries(memberMap)) {
      if (name.includes(normalized) || normalized.includes(name)) {
        return id;
      }
    }
    
    return null;
  }

  // Parse lessen en deelnemers
  const lessons = [];
  
  Object.entries(dayColumns).forEach(([dayName, colIndex]) => {
    const dayOfWeek = dayNameToNumber(dayName);
    if (dayOfWeek === -1) return;

    let currentLesson = null;
    let currentParticipants = [];

    // Loop door alle rijen (skip header)
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const cellValue = data[rowIndex]?.[colIndex];
      if (!cellValue) {
        // Lege cel - als we een les hebben, sla deze op
        if (currentLesson && currentParticipants.length > 0) {
          lessons.push({
            ...currentLesson,
            dayOfWeek: dayOfWeek,
            dayName: dayName,
            participants: [...currentParticipants]
          });
          currentLesson = null;
          currentParticipants = [];
        }
        continue;
      }

      const cellStr = cellValue.toString().trim();
      
      // Check of dit een les is (bevat tijd)
      const lesInfo = parseLesInfo(cellStr);
      if (lesInfo) {
        // Nieuwe les gevonden - sla vorige les op als die bestaat
        if (currentLesson && currentParticipants.length > 0) {
          lessons.push({
            ...currentLesson,
            dayOfWeek: dayOfWeek,
            dayName: dayName,
            participants: [...currentParticipants]
          });
        }
        
        // Start nieuwe les
        currentLesson = {
          name: `${dayName} ${lesInfo.time} ${lesInfo.type}`,
          time: lesInfo.time,
          duration: lesInfo.duration,
          type: lesInfo.type,
          dayOfWeek: dayOfWeek,
          dayName: dayName
        };
        currentParticipants = [];
      } else {
        // Dit is waarschijnlijk een deelnemer naam
        const memberId = findMemberId(cellStr);
        
        if (memberId) {
          // Voorkom duplicaten
          if (!currentParticipants.includes(memberId)) {
            currentParticipants.push(memberId);
          }
        } else {
          console.log(`⚠️  Klant niet gevonden: "${cellStr}"`);
        }
      }
    }

    // Sla laatste les op
    if (currentLesson && currentParticipants.length > 0) {
      lessons.push({
        ...currentLesson,
        dayOfWeek: dayOfWeek,
        dayName: dayName,
        participants: [...currentParticipants]
      });
    }
  });

  console.log(`\n✅ ${lessons.length} lessen gevonden met deelnemers\n`);

  // Test database connectie
  console.log('🔌 Testen database connectie...');
  const { error: testError } = await supabase
    .from('recurring_lessons')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('❌ Database connectie fout:', testError.message);
    console.log('\nZorg dat je eerst de migration uitvoert: database-migration-recurring-lessons.sql');
    process.exit(1);
  }
  
  console.log('✅ Database connectie succesvol!\n');

  // Importeer lessen
  console.log('📤 Lessen importeren naar Supabase...');
  
  const results = {
    lessonsCreated: 0,
    lessonsUpdated: 0,
    participantsAdded: 0,
    errors: 0
  };

  const colors = ['blue', 'teal', 'orange', 'amber', 'green', 'purple', 'pink', 'indigo'];
  let colorIndex = 0;

  for (const lesson of lessons) {
    try {
      // Check of les al bestaat (op basis van dag, tijd en type)
      const { data: existing } = await supabase
        .from('recurring_lessons')
        .select('id')
        .eq('day_of_week', lesson.dayOfWeek)
        .eq('time', lesson.time)
        .eq('type', lesson.type)
        .single();

      let lessonId;
      
      if (existing) {
        // Update bestaande les
        const { error: updateError } = await supabase
          .from('recurring_lessons')
          .update({
            name: lesson.name,
            duration: lesson.duration,
            max_participants: Math.max(lesson.participants.length, 10)
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        
        lessonId = existing.id;
        results.lessonsUpdated++;
        console.log(`✓ Updated: ${lesson.name}`);
      } else {
        // Nieuwe les aanmaken
        const color = colors[colorIndex % colors.length];
        colorIndex++;

        const { data: newLesson, error: insertError } = await supabase
          .from('recurring_lessons')
          .insert([{
            name: lesson.name,
            day_of_week: lesson.dayOfWeek,
            time: lesson.time,
            duration: lesson.duration,
            type: lesson.type,
            max_participants: Math.max(lesson.participants.length, 10),
            color: color
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        
        lessonId = newLesson.id;
        results.lessonsCreated++;
        console.log(`✓ Created: ${lesson.name} (${lesson.participants.length} deelnemers)`);
      }

      // Verwijder oude deelnemers voor deze les
      await supabase
        .from('lesson_participants')
        .delete()
        .eq('recurring_lesson_id', lessonId);

      // Voeg nieuwe deelnemers toe
      if (lesson.participants.length > 0) {
        const participantsToInsert = lesson.participants.map(memberId => ({
          recurring_lesson_id: lessonId,
          member_id: memberId
        }));

        const { error: participantsError } = await supabase
          .from('lesson_participants')
          .insert(participantsToInsert);

        if (participantsError) {
          console.error(`⚠️  Fout bij toevoegen deelnemers voor ${lesson.name}:`, participantsError.message);
        } else {
          results.participantsAdded += lesson.participants.length;
        }
      }
    } catch (error) {
      console.error(`❌ Fout bij ${lesson.name}:`, error.message);
      results.errors++;
    }
  }

  console.log(`\n📊 Import resultaat:`);
  console.log(`   ✓ Nieuwe lessen: ${results.lessonsCreated}`);
  console.log(`   ✓ Geüpdatete lessen: ${results.lessonsUpdated}`);
  console.log(`   ✓ Deelnemers toegevoegd: ${results.participantsAdded}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log('\n✅ Import voltooid!');
}

