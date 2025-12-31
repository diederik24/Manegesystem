// Test script voor Mollie payment
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '.env');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('No .env file found, using environment variables');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPayment() {
  console.log('🧪 Testing Mollie payment creation...\n');

  try {
    // Test payment data
    const testPayment = {
      type: 'factuur',
      id: 'test-factuur-' + Date.now(), // Test ID
      amount: 10.00, // Small test amount
      description: 'Test betaling voor Mollie integratie',
      customerEmail: 'test@example.com',
      customerName: 'Test Klant',
      redirectUrl: 'http://localhost:5000/payment-success',
    };

    console.log('📤 Creating payment with data:');
    console.log(JSON.stringify(testPayment, null, 2));
    console.log('\n');

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: testPayment,
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data.success && data.paymentUrl) {
      console.log('✅ Payment created successfully!');
      console.log('📋 Payment ID:', data.paymentId);
      console.log('🔗 Payment URL:', data.paymentUrl);
      console.log('📊 Status:', data.status);
      console.log('\n🌐 Open this URL in your browser to test the payment:');
      console.log(data.paymentUrl);
    } else {
      console.error('❌ Payment creation failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPayment();




