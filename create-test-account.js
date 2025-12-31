/**
 * Script om een testaccount aan te maken voor de klantenwebapp
 * Dit maakt een Supabase Auth account aan en koppelt het aan een bestaande klant
 */

import { createClient } from '@supabase/supabase-js';
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
        const value = valueParts.join('=').trim();
        if (key && value) {
          if (key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') {
            supabaseUrl = value;
          } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
            supabaseServiceRoleKey = value;
          }
        }
      }
    });
  }
} catch (error) {
  // Ignore file read errors
}

// Fallback naar process.env
if (!supabaseUrl) {
  supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
}
if (!supabaseServiceRoleKey) {
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Fout: SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY moeten zijn ingesteld');
  console.error('Gebruik: VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node create-test-account.js');
  process.exit(1);
}

// Maak Supabase client met service role key (heeft admin rechten)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount() {
  try {
    console.log('🔐 Testaccount aanmaken...\n');

    // Test email en wachtwoord
    const testEmail = 'test@duiksehoef.nl';
    const testPassword = 'Test123456!';
    
    // Vind een bestaande klant met leskaarten
    console.log('📋 Zoeken naar een klant met actieve leskaarten...');
    const { data: membersWithLeskaarten, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        leskaarten!inner(id, status)
      `)
      .eq('leskaarten.status', 'actief')
      .limit(1);

    if (membersError) {
      console.error('❌ Fout bij ophalen klanten:', membersError);
      // Probeer gewoon de eerste klant
      const { data: firstMember, error: firstError } = await supabase
        .from('members')
        .select('id, name, email')
        .limit(1)
        .single();

      if (firstError || !firstMember) {
        console.error('❌ Geen klanten gevonden in de database');
        process.exit(1);
      }

      const memberId = firstMember.id;
      console.log(`✅ Klant gevonden: ${firstMember.name} (${firstMember.email})`);
      console.log(`   Member ID: ${memberId}\n`);

        // Maak auth account aan
        console.log(`📧 Auth account aanmaken: ${testEmail}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true, // Auto-confirm email
        });

        let authUserId;
        if (authError) {
          if (authError.message.includes('already registered') || authError.code === 'email_exists') {
          console.log('⚠️  Account bestaat al, ophalen...');
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const user = existingUser.users.find(u => u.email === testEmail);
          
          if (!user) {
            console.error('❌ Account bestaat maar kan niet worden gevonden');
            process.exit(1);
          }

          const authUserId = user.id;
          console.log(`✅ Bestaand account gevonden: ${authUserId}\n`);

          // Koppel account aan klant via directe insert/update
          console.log('🔗 Account koppelen aan klant...');
          // Gebruik schema.tafel formaat
          const { data: insertData, error: insertError } = await supabase
            .schema('klantappversie1')
            .from('customer_accounts')
            .insert({
              auth_user_id: authUserId,
              member_id: memberId
            })
            .select()
            .single();

          if (insertError) {
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              // Unique violation - bestaat al, update
              console.log('⚠️  Koppeling bestaat al, bijwerken...');
              const { data: updateData, error: updateError } = await supabase
                .schema('klantappversie1')
                .from('customer_accounts')
                .update({ 
                  member_id: memberId, 
                  updated_at: new Date().toISOString() 
                })
                .eq('auth_user_id', authUserId)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Fout bij bijwerken:', updateError);
                process.exit(1);
              }
            } else {
              console.error('❌ Fout bij koppelen:', insertError);
              process.exit(1);
            }
          }

          console.log('✅ Account succesvol gekoppeld!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📝 INLOG GEGEVENS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Email:    ${testEmail}`);
          console.log(`Wachtwoord: ${testPassword}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('🌐 Login URL: http://localhost:3000/login');
          console.log('   (of je Vercel deployment URL)\n');
        } else {
          throw authError;
        }
      } else {
        const authUserId = authData.user.id;
        console.log(`✅ Auth account aangemaakt: ${authUserId}\n`);

        // Koppel account aan klant
        console.log('🔗 Account koppelen aan klant...');
        const { data: insertData3, error: insertError3 } = await supabase
          .schema('klantappversie1')
          .from('customer_accounts')
          .insert({
            auth_user_id: authUserId,
            member_id: memberId
          })
          .select()
          .single();

        if (insertError3) {
          if (insertError3.code === '23505' || insertError3.message?.includes('duplicate')) {
            // Unique violation - bestaat al, update
            const { data: updateData3, error: updateError3 } = await supabase
              .schema('klantappversie1')
              .from('customer_accounts')
              .update({ 
                member_id: memberId, 
                updated_at: new Date().toISOString() 
              })
              .eq('auth_user_id', authUserId)
              .select()
              .single();

            if (updateError3) {
              console.error('❌ Fout bij bijwerken:', updateError3);
              process.exit(1);
            }
          } else {
            console.error('❌ Fout bij koppelen:', insertError3);
            process.exit(1);
          }
        }

        console.log('✅ Account succesvol gekoppeld!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 INLOG GEGEVENS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:    ${testEmail}`);
        console.log(`Wachtwoord: ${testPassword}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🌐 Login URL: http://localhost:3000/login');
        console.log('   (of je Vercel deployment URL)\n');
      }
    } else {
      if (!membersWithLeskaarten || membersWithLeskaarten.length === 0) {
        console.log('⚠️  Geen klanten met actieve leskaarten gevonden, gebruik eerste klant...');
        const { data: firstMember } = await supabase
          .from('members')
          .select('id, name, email')
          .limit(1)
          .single();

        if (!firstMember) {
          console.error('❌ Geen klanten gevonden in de database');
          process.exit(1);
        }

        const memberId = firstMember.id;
        console.log(`✅ Klant gevonden: ${firstMember.name} (${firstMember.email})`);
        console.log(`   Member ID: ${memberId}\n`);

        // Maak auth account aan
        console.log(`📧 Auth account aanmaken: ${testEmail}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.code === 'email_exists') {
            console.log('⚠️  Account bestaat al, ophalen...');
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const user = existingUser.users.find(u => u.email === testEmail);
            
            if (!user) {
              console.error('❌ Account bestaat maar kan niet worden gevonden');
              process.exit(1);
            }

            const authUserId = user.id;
            console.log(`✅ Bestaand account gevonden: ${authUserId}\n`);

            // Koppel account aan klant
            console.log('🔗 Account koppelen aan klant...');
            // Koppel account aan klant via directe insert/update
          const { data: insertData2, error: insertError2 } = await supabase
            .schema('klantappversie1')
            .from('customer_accounts')
            .insert({
              auth_user_id: authUserId,
              member_id: memberId
            })
            .select()
            .single();

          if (insertError2) {
            if (insertError2.code === '23505' || insertError2.message?.includes('duplicate')) {
              // Unique violation - bestaat al, update
              const { data: updateData2, error: updateError2 } = await supabase
                .schema('klantappversie1')
                .from('customer_accounts')
                .update({ 
                  member_id: memberId, 
                  updated_at: new Date().toISOString() 
                })
                .eq('auth_user_id', authUserId)
                .select()
                .single();

              if (updateError2) {
                console.error('❌ Fout bij bijwerken:', updateError2);
                process.exit(1);
              }
            } else {
              console.error('❌ Fout bij koppelen:', insertError2);
              process.exit(1);
            }
          }

          console.log('✅ Account succesvol gekoppeld!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📝 INLOG GEGEVENS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Email:    ${testEmail}`);
            console.log(`Wachtwoord: ${testPassword}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🌐 Login URL: http://localhost:3000/login');
            console.log('   (of je Vercel deployment URL)\n');
          } else {
            throw authError;
          }
        } else {
          const authUserId = authData.user.id;
          console.log(`✅ Auth account aangemaakt: ${authUserId}\n`);

          // Koppel account aan klant via directe insert/update
          console.log('🔗 Account koppelen aan klant...');
          // Gebruik schema.tafel formaat
          const { data: insertData, error: insertError } = await supabase
            .schema('klantappversie1')
            .from('customer_accounts')
            .insert({
              auth_user_id: authUserId,
              member_id: memberId
            })
            .select()
            .single();

          if (insertError) {
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              // Unique violation - bestaat al, update
              console.log('⚠️  Koppeling bestaat al, bijwerken...');
              const { data: updateData, error: updateError } = await supabase
                .schema('klantappversie1')
                .from('customer_accounts')
                .update({ 
                  member_id: memberId, 
                  updated_at: new Date().toISOString() 
                })
                .eq('auth_user_id', authUserId)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Fout bij bijwerken:', updateError);
                process.exit(1);
              }
            } else {
              console.error('❌ Fout bij koppelen:', insertError);
              process.exit(1);
            }
          }

          console.log('✅ Account succesvol gekoppeld!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📝 INLOG GEGEVENS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Email:    ${testEmail}`);
          console.log(`Wachtwoord: ${testPassword}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('🌐 Login URL: http://localhost:3000/login');
          console.log('   (of je Vercel deployment URL)\n');
        }
      } else {
        const member = membersWithLeskaarten[0];
        const memberId = member.id;
        console.log(`✅ Klant gevonden: ${member.name} (${member.email})`);
        console.log(`   Member ID: ${memberId}\n`);

        // Maak auth account aan
        console.log(`📧 Auth account aanmaken: ${testEmail}...`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.code === 'email_exists') {
            console.log('⚠️  Account bestaat al, ophalen...');
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const user = existingUser.users.find(u => u.email === testEmail);
            
            if (!user) {
              console.error('❌ Account bestaat maar kan niet worden gevonden');
              process.exit(1);
            }

            const authUserId = user.id;
            console.log(`✅ Bestaand account gevonden: ${authUserId}\n`);

            // Koppel account aan klant
            console.log('🔗 Account koppelen aan klant...');
            // Koppel account aan klant via directe insert/update
          const { data: insertData2, error: insertError2 } = await supabase
            .schema('klantappversie1')
            .from('customer_accounts')
            .insert({
              auth_user_id: authUserId,
              member_id: memberId
            })
            .select()
            .single();

          if (insertError2) {
            if (insertError2.code === '23505' || insertError2.message?.includes('duplicate')) {
              // Unique violation - bestaat al, update
              const { data: updateData2, error: updateError2 } = await supabase
                .schema('klantappversie1')
                .from('customer_accounts')
                .update({ 
                  member_id: memberId, 
                  updated_at: new Date().toISOString() 
                })
                .eq('auth_user_id', authUserId)
                .select()
                .single();

              if (updateError2) {
                console.error('❌ Fout bij bijwerken:', updateError2);
                process.exit(1);
              }
            } else {
              console.error('❌ Fout bij koppelen:', insertError2);
              process.exit(1);
            }
          }

          console.log('✅ Account succesvol gekoppeld!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📝 INLOG GEGEVENS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Email:    ${testEmail}`);
            console.log(`Wachtwoord: ${testPassword}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🌐 Login URL: http://localhost:3000/login');
            console.log('   (of je Vercel deployment URL)\n');
          } else {
            throw authError;
          }
        } else {
          const authUserId = authData.user.id;
          console.log(`✅ Auth account aangemaakt: ${authUserId}\n`);

          // Koppel account aan klant via directe insert/update
          console.log('🔗 Account koppelen aan klant...');
          // Gebruik schema.tafel formaat
          const { data: insertData, error: insertError } = await supabase
            .schema('klantappversie1')
            .from('customer_accounts')
            .insert({
              auth_user_id: authUserId,
              member_id: memberId
            })
            .select()
            .single();

          if (insertError) {
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              // Unique violation - bestaat al, update
              console.log('⚠️  Koppeling bestaat al, bijwerken...');
              const { data: updateData, error: updateError } = await supabase
                .schema('klantappversie1')
                .from('customer_accounts')
                .update({ 
                  member_id: memberId, 
                  updated_at: new Date().toISOString() 
                })
                .eq('auth_user_id', authUserId)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Fout bij bijwerken:', updateError);
                process.exit(1);
              }
            } else {
              console.error('❌ Fout bij koppelen:', insertError);
              process.exit(1);
            }
          }

          console.log('✅ Account succesvol gekoppeld!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📝 INLOG GEGEVENS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Email:    ${testEmail}`);
          console.log(`Wachtwoord: ${testPassword}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('🌐 Login URL: http://localhost:3000/login');
          console.log('   (of je Vercel deployment URL)\n');
        }
      }
    }
  } catch (error) {
    console.error('❌ Onverwachte fout:', error);
    process.exit(1);
  }
}

// Run het script
createTestAccount();

