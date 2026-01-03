// Script om test emails te versturen naar meerdere adressen
// Gebruik: node send-test-emails.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cdoadjyktlrgungskhvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2FkanlrdGxyZ3VuZ3NraHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTY3ODksImV4cCI6MjA4MTI3Mjc4OX0.YdYs_tc-v0wZC0hpyzAlRbjF88v5CVVXBvn3_hZ_gVc';

const emailAddresses = [
  'diederik24@icloud.com',
  'diederikstraver1@gmail.com',
  'continumd@gmail.com'
];

async function sendTestEmails() {
  console.log('📧 Test emails versturen naar 3 adressen...\n');
  console.log('Email adressen:', emailAddresses.join(', '));
  console.log('\n');

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is niet ingesteld!');
    console.error('Zet deze in je environment variabelen of .env bestand');
    process.exit(1);
  }

  const results = [];

  for (const email of emailAddresses) {
    try {
      console.log(`📬 Versturen naar: ${email}...`);

      const emailData = {
        to: email,
        subject: 'Test Email - Manege Duikse Hoef',
        htmlBody: `
          <h2>Dit is een test mail</h2>
          <p>Deze email is verstuurd om te testen of de Gmail configuratie werkt.</p>
          <p>Als je deze email ontvangt, werkt alles correct!</p>
          <p><strong>Ontvanger:</strong> ${email}</p>
          <p><strong>Tijdstip:</strong> ${new Date().toLocaleString('nl-NL')}</p>
        `,
        textBody: `
Dit is een test mail

Deze email is verstuurd om te testen of de Gmail configuratie werkt.
Als je deze email ontvangt, werkt alles correct!

Ontvanger: ${email}
Tijdstip: ${new Date().toLocaleString('nl-NL')}
        `,
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ Succesvol verstuurd naar ${email}`);
        console.log(`   Message ID: ${result.messageId || 'N/A'}\n`);
        results.push({ email, success: true, messageId: result.messageId });
      } else {
        console.error(`❌ Fout bij ${email}:`);
        console.error(`   Status: ${response.status}`);
        console.error(`   Error: ${result.error || JSON.stringify(result)}\n`);
        results.push({ email, success: false, error: result.error || 'Unknown error' });
      }
    } catch (error) {
      console.error(`❌ Fout bij ${email}:`, error.message);
      console.error('');
      results.push({ email, success: false, error: error.message });
    }
  }

  // Samenvatting
  console.log('\n📊 Samenvatting:');
  console.log('='.repeat(50));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Succesvol: ${successful}/${emailAddresses.length}`);
  console.log(`❌ Gefaald: ${failed}/${emailAddresses.length}`);
  
  if (failed > 0) {
    console.log('\nGefaalde emails:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }

  console.log('\n💡 Tip: Check je inbox (en spam folder) voor de emails!');
}

sendTestEmails().catch(error => {
  console.error('❌ Onverwachte fout:', error);
  process.exit(1);
});

