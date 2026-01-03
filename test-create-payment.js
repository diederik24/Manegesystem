// Test script om te controleren of create-payment functie werkt
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cdoadjyktlrgungskhvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2FkanlrdGxyZ3VuZ3NraHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTY3ODksImV4cCI6MjA4MTI3Mjc4OX0.YdYs_tc-v0wZC0hpyzAlRbjF88v5CVVXBvn3_hZ_gVc';

async function testCreatePayment() {
  console.log('🧪 Test create-payment functie...\n');

  const testPayment = {
    type: 'consumptie',
    id: `test-${Date.now()}`,
    amount: 0.01,
    description: 'Test payment',
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
      console.log('\n✅ create-payment functie werkt!');
      console.log('Payment ID:', result.paymentId);
      console.log('Payment URL:', result.paymentUrl);
    } else {
      console.log('\n❌ create-payment functie heeft een probleem:');
      console.log('Error:', result.error);
      console.log('Code:', result.code);
      console.log('\nMogelijke oorzaken:');
      console.log('1. create-payment functie bestaat niet in Supabase');
      console.log('2. MOLLIE_API_KEY is niet ingesteld in Supabase Secrets');
      console.log('3. SUPABASE_URL is niet ingesteld in create-payment functie');
      console.log('4. MOLLIE_WEBHOOK_SECRET is niet ingesteld in Supabase Secrets');
    }
  } catch (error) {
    console.error('❌ Fout:', error.message);
  }
}

testCreatePayment();


