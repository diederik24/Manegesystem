// Test script om Supabase verbinding te testen
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file manually
try {
  const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  // Set environment variables
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('VITE_')) {
      process.env[key] = envVars[key];
    }
  });
} catch (error) {
  console.error('Could not read .env.local file:', error.message);
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Test 1: Check auth session
    const { data: session, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      if (authError.message.includes('Invalid API key')) {
        console.error('❌ Invalid API key! Check your VITE_SUPABASE_ANON_KEY');
        return;
      }
      if (authError.message.includes('Failed to fetch')) {
        console.error('❌ Cannot connect to Supabase! Check your VITE_SUPABASE_URL');
        return;
      }
    }
    
    console.log('✓ Connection successful!');
    
    // Test 2: Check if tables exist
    console.log('\nChecking tables...');
    const tables = ['members', 'calendar_events', 'consumptie_kaarten', 'transactions'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`  ${table}: ❌ Table does not exist`);
          } else {
            console.log(`  ${table}: ⚠️  Error: ${error.message}`);
          }
        } else {
          console.log(`  ${table}: ✓ Exists (${count || 0} rows)`);
        }
      } catch (e) {
        console.log(`  ${table}: ❌ Error checking table`);
      }
    }
    
    console.log('\n✅ Connection test completed!');
    console.log('\n💡 Tip: If tables don\'t exist, run the SQL commands from database.sql in Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();

