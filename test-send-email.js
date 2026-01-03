// Test script om een email te versturen via Supabase Edge Function
// Gebruik: node test-send-email.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cdoadjyktlrgungskhvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testSendEmail() {
  try {
    console.log('📧 Test email versturen via Supabase Edge Function...\n');

    // Test email data
    const emailData = {
      testMode: true, // Test mode
      to: 'diederik24@gmail.com', // Vervang met je eigen email
      subject: 'Test Email - Manege Duikse Hoef',
    };

    console.log('Email data:', emailData);
    console.log('\nAanroepen van Supabase Edge Function...\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Succes!');
      console.log('Resultaat:', JSON.stringify(result, null, 2));
      console.log('\n📬 Check je inbox voor de test email!');
    } else {
      console.error('❌ Fout bij versturen email:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('❌ Fout:', error.message);
    console.error('\nZorg dat:');
    console.error('1. De Edge Function is gedeployed: supabase functions deploy send-email');
    console.error('2. GMAIL_USER en GMAIL_PASSWORD zijn ingesteld in Supabase Secrets');
    console.error('3. VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY zijn ingesteld');
  }
}

testSendEmail();


