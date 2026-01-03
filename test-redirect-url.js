// Test script om te controleren welke redirect URL wordt gebruikt
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cdoadjyktlrgungskhvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2FkanlrdGxyZ3VuZ3NraHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTY3ODksImV4cCI6MjA4MTI3Mjc4OX0.YdYs_tc-v0wZC0hpyzAlRbjF88v5CVVXBvn3_hZ_gVc';

async function testRedirectUrl() {
  console.log('🧪 Test redirect URL in create-payment functie...\n');

  const testPayment = {
    amount: 0.01,
    description: 'Test redirect URL',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
  };

  console.log('Payment data:', JSON.stringify(testPayment, null, 2));
  console.log('\nAanroepen van create-payment functie...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testPayment),
    });

    const result = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Payment aangemaakt!');
      console.log('Payment ID:', result.paymentId);
      console.log('Payment URL:', result.paymentUrl);
      
      // Check de payment URL - deze zou moeten leiden naar Mollie checkout
      // Na betaling zou de redirect naar https://www.manegeduiksehoef.nl moeten gaan
      console.log('\n📝 Let op:');
      console.log('   - De redirect URL wordt ingesteld in de create-payment functie');
      console.log('   - Na betaling wordt je doorgestuurd naar: https://www.manegeduiksehoef.nl');
      console.log('   - Als je nog steeds naar manegesystem.vercel.app wordt doorgestuurd,');
      console.log('     dan is de functie waarschijnlijk nog niet geüpdatet in Supabase');
    } else {
      console.log('\n❌ Fout bij aanmaken payment:');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Fout:', error.message);
  }
}

testRedirectUrl();


