import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Try to load dotenv if available (optional)
try {
  const dotenv = await import('dotenv');
  dotenv.default.config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

// Genereer een veilige API key
function generateApiKey() {
  const randomBytes = crypto.randomBytes(32);
  const base64 = randomBytes.toString('base64');
  // Vervang URL-unsafe karakters
  return 'mk_' + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function createApiKey() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Zorg dat VITE_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  // Haal member ID of email op van command line argument
  const identifier = process.argv[2];
  
  if (!identifier) {
    console.error('❌ Gebruik: node create-api-key.js <member-id-of-email>');
    console.error('Voorbeeld: node create-api-key.js klant@example.com');
    console.error('Of: node create-api-key.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }

  // Zoek member op basis van ID, email of naam
  let memberQuery = supabase
    .from('members')
    .select('id, name, email');

  // Check of het een UUID is (member ID), email of naam
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(identifier)) {
    memberQuery = memberQuery.eq('id', identifier);
  } else if (identifier.includes('@')) {
    // Het is waarschijnlijk een email
    memberQuery = memberQuery.eq('email', identifier);
  } else {
    // Zoek op naam (case-insensitive, partial match)
    memberQuery = memberQuery.ilike('name', `%${identifier}%`);
  }

  const { data: members, error: memberError } = await memberQuery;
  
  let member;
  if (members && members.length > 0) {
    if (members.length > 1) {
      console.log('\n⚠️  Meerdere klanten gevonden:');
      members.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name} (${m.email || 'geen email'})`);
      });
      console.log('\nGebruik een specifiekere zoekterm of email adres.');
      process.exit(1);
    }
    member = members[0];
  }

  if (memberError || !member) {
    console.error('❌ Klant niet gevonden:', identifier);
    process.exit(1);
  }

  // Check of er al een API key bestaat voor deze klant
  const { data: existingKey, error: existingError } = await supabase
    .from('api_keys')
    .select('id, api_key, is_active, created_at')
    .eq('member_id', member.id)
    .single();

  if (existingKey && !existingError) {
    console.log('\n⚠️  Er bestaat al een API key voor deze klant:');
    console.log('Klant:', member.name, `(${member.email})`);
    console.log('API Key:', existingKey.api_key);
    console.log('Status:', existingKey.is_active ? 'Actief' : 'Inactief');
    console.log('Aangemaakt:', new Date(existingKey.created_at).toLocaleString('nl-NL'));
    
    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      readline.question('\nWil je een nieuwe key aanmaken? (ja/nee): ', resolve);
    });

    readline.close();

    if (answer.toLowerCase() !== 'ja' && answer.toLowerCase() !== 'j') {
      console.log('Geannuleerd.');
      process.exit(0);
    }

    // Deactiveer oude key
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', existingKey.id);
  }

  // Genereer nieuwe API key
  const apiKey = generateApiKey();

  const { data: newKey, error: insertError } = await supabase
    .from('api_keys')
    .insert([{
      member_id: member.id,
      api_key: apiKey,
      is_active: true,
      notes: `Aangemaakt voor ${member.name}`
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating API key:', insertError);
    process.exit(1);
  }

  console.log('\n✅ API Key succesvol aangemaakt!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Klant:', member.name);
  console.log('Email:', member.email);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('API Key:', apiKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Sla deze key op een veilige plek op!');
  console.log('Deze wordt niet opnieuw getoond.\n');
  console.log('Gebruik in de andere webapp:');
  console.log(`fetch('https://jouw-domein.vercel.app/api/get-customer-data', {`);
  console.log(`  headers: { 'X-API-Key': '${apiKey}' }`);
  console.log(`})`);
  console.log('');
}

createApiKey().catch(console.error);

