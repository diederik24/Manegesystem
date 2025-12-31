import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lees environment variabelen
let supabaseUrl = '';
let supabaseServiceRoleKey = '';

// Probeer eerst .env bestanden te lezen
try {
  let envContent = '';
  try {
    envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  } catch (e) {
    try {
      envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    } catch (e2) {
      // Geen .env bestand gevonden
    }
  }
  
  if (envContent) {
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceRoleKey = value;
      }
    });
  }
} catch (e) {
  // Fallback naar environment variables
}

// Fallback naar environment variables
if (!supabaseUrl) supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (!supabaseServiceRoleKey) supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check command line arguments
const urlArg = process.argv.find(arg => arg.startsWith('--url='));
const keyArg = process.argv.find(arg => arg.startsWith('--key='));
if (urlArg) supabaseUrl = urlArg.split('=')[1];
if (keyArg) supabaseServiceRoleKey = keyArg.split('=')[1];

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('\n📝 Je kunt credentials op drie manieren instellen:');
  console.log('\n1️⃣ Via .env bestand (aanbevolen):');
  console.log('   Maak een .env bestand met:');
  console.log('   VITE_SUPABASE_URL=https://jouw-project.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key');
  console.log('\n2️⃣ Via environment variables:');
  console.log('   $env:VITE_SUPABASE_URL="https://jouw-project.supabase.co"');
  console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="jouw-service-role-key"');
  console.log('\n3️⃣ Via command line arguments:');
  console.log('   node export-lesklanten-excel.js --url=https://jouw-project.supabase.co --key=jouw-service-role-key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function exportLesklantenToExcel() {
  try {
    console.log('📊 Ophalen van alle lesklanten...\n');

    // Stap 1: Haal alle unieke member_ids op die in lessen zitten
    console.log('1️⃣ Ophalen van lesdeelnemers...');
    const { data: participants, error: participantsError } = await supabase
      .from('lesson_participants')
      .select('member_id, family_member_id, recurring_lesson_id');

    if (participantsError) {
      throw new Error(`Fout bij ophalen deelnemers: ${participantsError.message}`);
    }

    if (!participants || participants.length === 0) {
      console.log('⚠️ Geen lesdeelnemers gevonden.');
      return;
    }

    console.log(`✅ ${participants.length} lesdeelnames gevonden\n`);

    // Stap 2: Haal alle unieke member_ids op (zowel directe klanten als hoofdklanten van gezinsleden)
    const memberIds = new Set();
    const familyMemberIds = new Set();

    participants.forEach(p => {
      if (p.member_id) {
        memberIds.add(p.member_id);
      }
      if (p.family_member_id) {
        familyMemberIds.add(p.family_member_id);
      }
    });

    // Stap 3: Haal alle klanten op
    console.log('2️⃣ Ophalen van klantgegevens...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email, phone, status, balance, created_at')
      .in('id', Array.from(memberIds));

    if (membersError) {
      throw new Error(`Fout bij ophalen klanten: ${membersError.message}`);
    }

    console.log(`✅ ${members?.length || 0} klanten gevonden\n`);

    // Stap 4: Haal alle gezinsleden op
    let familyMembers = [];
    if (familyMemberIds.size > 0) {
      console.log('3️⃣ Ophalen van gezinsleden...');
      const { data: fm, error: fmError } = await supabase
        .from('family_members')
        .select('id, member_id, name, geboortedatum, email, telefoon, status')
        .in('id', Array.from(familyMemberIds));

      if (fmError) {
        console.warn(`⚠️ Fout bij ophalen gezinsleden: ${fmError.message}`);
      } else {
        familyMembers = fm || [];
        console.log(`✅ ${familyMembers.length} gezinsleden gevonden\n`);
      }
    }

    // Stap 5: Haal alle lesgroepen op
    console.log('4️⃣ Ophalen van lesgroepen...');
    const lessonIds = [...new Set(participants.map(p => p.recurring_lesson_id))];
    const { data: lessons, error: lessonsError } = await supabase
      .from('recurring_lessons')
      .select('id, name, day_of_week, time, type, instructor')
      .in('id', lessonIds);

    if (lessonsError) {
      throw new Error(`Fout bij ophalen lessen: ${lessonsError.message}`);
    }

    const lessonsMap = new Map();
    (lessons || []).forEach(lesson => {
      lessonsMap.set(lesson.id, lesson);
    });

    const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

    console.log(`✅ ${lessons?.length || 0} lesgroepen gevonden\n`);

    // Stap 6: Haal leskaarten op voor alle klanten
    console.log('5️⃣ Ophalen van leskaarten...');
    const { data: leskaarten, error: leskaartenError } = await supabase
      .from('leskaarten')
      .select('id, klant_id, totaal_lessen, gebruikte_lessen, resterende_lessen, start_datum, eind_datum, status')
      .in('klant_id', Array.from(memberIds));

    if (leskaartenError) {
      console.warn(`⚠️ Fout bij ophalen leskaarten: ${leskaartenError.message}`);
    }

    const leskaartenMap = new Map();
    (leskaarten || []).forEach(kaart => {
      if (!leskaartenMap.has(kaart.klant_id)) {
        leskaartenMap.set(kaart.klant_id, []);
      }
      leskaartenMap.get(kaart.klant_id).push(kaart);
    });

    console.log(`✅ ${leskaarten?.length || 0} leskaarten gevonden\n`);

    // Stap 7: Maak een map van hoofdklanten voor gezinsleden
    const familyToMemberMap = new Map();
    familyMembers.forEach(fm => {
      familyToMemberMap.set(fm.id, fm.member_id);
    });

    // Stap 8: Bouw de Excel data op
    console.log('6️⃣ Opbouwen van Excel data...\n');

    const excelData = [];

    // Voor elke klant die in lessen zit
    for (const member of (members || [])) {
      // Vind alle lessen waar deze klant in zit (zowel direct als via gezinsleden)
      const memberParticipations = participants.filter(p => p.member_id === member.id);
      
      // Vind lessen waar gezinsleden van deze klant in zitten
      const familyParticipations = participants.filter(p => {
        const fm = familyMembers.find(f => f.id === p.family_member_id);
        return fm && fm.member_id === member.id;
      });

      // Combineer alle deelnames
      const allParticipations = [...memberParticipations, ...familyParticipations];

      if (allParticipations.length === 0) continue;

      // Groepeer per les
      const lessonsByGroup = new Map();
      allParticipations.forEach(p => {
        const lesson = lessonsMap.get(p.recurring_lesson_id);
        if (lesson) {
          const key = lesson.id;
          if (!lessonsByGroup.has(key)) {
            lessonsByGroup.set(key, {
              lesson,
              participants: []
            });
          }
          if (p.family_member_id) {
            const fm = familyMembers.find(f => f.id === p.family_member_id);
            if (fm) {
              lessonsByGroup.get(key).participants.push({
                type: 'gezinslid',
                name: fm.name,
                id: fm.id
              });
            }
          } else {
            lessonsByGroup.get(key).participants.push({
              type: 'klant',
              name: member.name,
              id: member.id
            });
          }
        }
      });

      // Maak een rij per lesgroep
      for (const [lessonId, lessonData] of lessonsByGroup) {
        const lesson = lessonData.lesson;
        const deelnemers = lessonData.participants;

        // Leskaart informatie
        const memberLeskaarten = leskaartenMap.get(member.id) || [];
        const actieveLeskaart = memberLeskaarten.find(k => k.status === 'actief') || memberLeskaarten[0];
        
        // Bereken totaal resterende lessen
        const totaalResterend = memberLeskaarten
          .filter(k => k.status === 'actief')
          .reduce((sum, k) => sum + (k.resterende_lessen || 0), 0);

        // Voor elke deelnemer (klant of gezinslid) een rij
        deelnemers.forEach(deelnemer => {
          excelData.push({
            'Klant ID': member.id,
            'Klant Naam': member.name,
            'Email': member.email || '',
            'Telefoon': member.phone || '',
            'Status': member.status || '',
            'Saldo': member.balance || 0,
            'Deelnemer Type': deelnemer.type === 'gezinslid' ? 'Gezinslid' : 'Klant',
            'Deelnemer Naam': deelnemer.name,
            'Lesgroep': lesson.name || '',
            'Dag': dayNames[lesson.day_of_week] || `Dag ${lesson.day_of_week}`,
            'Tijd': lesson.time ? (typeof lesson.time === 'string' ? lesson.time.substring(0, 5) : lesson.time) : '',
            'Les Type': lesson.type || '',
            'Instructeur': lesson.instructor || '',
            'Resterende Lessen': totaalResterend,
            'Leskaart Status': actieveLeskaart?.status || '',
            'Leskaart Start': actieveLeskaart?.start_datum || '',
            'Leskaart Eind': actieveLeskaart?.eind_datum || '',
            'Aangemaakt': member.created_at ? new Date(member.created_at).toLocaleDateString('nl-NL') : ''
          });
        });
      }
    }

    // Stap 9: Maak Excel bestand
    console.log('7️⃣ Genereren van Excel bestand...\n');

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lesklanten');

    // Auto-size kolommen
    const colWidths = [
      { wch: 36 }, // Klant ID
      { wch: 25 }, // Klant Naam
      { wch: 30 }, // Email
      { wch: 15 }, // Telefoon
      { wch: 12 }, // Status
      { wch: 10 }, // Saldo
      { wch: 15 }, // Deelnemer Type
      { wch: 25 }, // Deelnemer Naam
      { wch: 30 }, // Lesgroep
      { wch: 12 }, // Dag
      { wch: 8 },  // Tijd
      { wch: 15 }, // Les Type
      { wch: 20 }, // Instructeur
      { wch: 18 }, // Resterende Lessen
      { wch: 15 }, // Leskaart Status
      { wch: 12 }, // Leskaart Start
      { wch: 12 }, // Leskaart Eind
      { wch: 12 }  // Aangemaakt
    ];
    worksheet['!cols'] = colWidths;

    // Genereer bestandsnaam met datum
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Lesklanten_${dateStr}.xlsx`;
    const filepath = path.join(__dirname, filename);

    XLSX.writeFile(workbook, filepath);

    console.log('✅ Excel bestand succesvol aangemaakt!');
    console.log(`📁 Locatie: ${filepath}`);
    console.log(`📊 Totaal aantal rijen: ${excelData.length}`);
    console.log(`👥 Unieke klanten: ${members?.length || 0}`);
    console.log(`📚 Lesgroepen: ${lessons?.length || 0}\n`);

  } catch (error) {
    console.error('❌ Fout bij exporteren:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run de export
exportLesklantenToExcel();

