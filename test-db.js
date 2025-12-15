// Simple test script voor Supabase verbinding
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = readFileSync('.env.local', 'utf-8');
  const lines = envContent.split(/\r?\n/);
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      // Handle both = and : separators, and handle quoted values
      const match = trimmed.match(/^([^=:]+)[=:](.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        
        if (key === 'VITE_SUPABASE_URL') {
          supabaseUrl = value;
        }
        if (key === 'VITE_SUPABASE_ANON_KEY') {
          supabaseAnonKey = value;
        }
      }
    }
  });
  
  console.log('Debug: Found URL:', supabaseUrl ? 'Yes (' + supabaseUrl.substring(0, 30) + '...)' : 'No');
  console.log('Debug: Found Key:', supabaseAnonKey ? 'Yes (' + supabaseAnonKey.substring(0, 20) + '...)' : 'No');
} catch (error) {
  console.error('❌ Kon .env.local niet lezen:', error.message);
  console.error('Zorg dat .env.local bestaat in de root directory');
  process.exit(1);
}

console.log('\n🔍 Supabase Verbinding Test\n');
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Ingesteld' : '✗ Niet ingesteld');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Ingesteld' : '✗ Niet ingesteld');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Ontbrekende environment variabelen!');
  console.error('Controleer je .env.local bestand.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔄 Testen verbinding met Supabase...\n');
    
    // Test verbinding
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.error('❌ Ongeldige API key!');
        console.error('Controleer je VITE_SUPABASE_ANON_KEY in .env.local');
        return;
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        console.error('❌ Kan niet verbinden met Supabase!');
        console.error('Controleer je VITE_SUPABASE_URL in .env.local');
        console.error('URL moet zijn: https://jouw-project-id.supabase.co');
        return;
      }
    }
    
    console.log('✅ Verbinding succesvol!\n');
    
    // Test tabellen
    console.log('📊 Controleren tabellen...\n');
    const tables = ['members', 'calendar_events', 'consumptie_kaarten', 'transactions'];
    
    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (tableError) {
          if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
            console.log(`  ${table}: ❌ Tabel bestaat niet`);
          } else {
            console.log(`  ${table}: ⚠️  Fout: ${tableError.message}`);
          }
        } else {
          console.log(`  ${table}: ✅ Bestaat (${count || 0} rijen)`);
        }
      } catch (e) {
        console.log(`  ${table}: ❌ Fout bij controleren`);
      }
    }
    
    console.log('\n✅ Verbindingstest voltooid!\n');
    console.log('💡 Tip: Als tabellen niet bestaan, voer de SQL commands uit database.sql uit in Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Verbindingstest mislukt:', error.message);
    process.exit(1);
  }
}

testConnection();

