import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Laad environment variables handmatig
function loadEnv() {
  const envPaths = [
    join(__dirname, '..', '.env.local'),
    join(__dirname, '..', '.env'),
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '.env')
  ];

  for (const envPath of envPaths) {
    try {
      if (readFileSync(envPath, 'utf-8')) {
        const envFile = readFileSync(envPath, 'utf-8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
              envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
            }
          }
        });
        Object.assign(process.env, envVars);
        console.log(`✓ Environment variables geladen van: ${envPath}`);
        return;
      }
    } catch (error) {
      // Continue naar volgende pad
    }
  }
  console.log('⚠️  Geen .env bestand gevonden, gebruik environment variables');
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Zorg dat VITE_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

async function sendAdminCredentials() {
  const recipientEmail = 'info@mee-hestar.nl';
  const loginEmail = 'info@manegeduiksehoef.nl';
  const loginPassword = 'Duikse55!';
  const loginUrl = 'http://bit.ly/3LuJlp0';

  console.log('📧 Versturen van inloggegevens...');
  console.log(`   Naar: ${recipientEmail}`);

  try {
    // HTML email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .logo-container {
      width: 80px;
      height: 80px;
      background-color: rgba(231, 45, 129, 0.1);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-container img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 50%;
    }
    h1 {
      color: #1e293b;
      text-align: center;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #e72d81;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .credentials-box {
      background-color: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
    }
    .credential-item {
      margin-bottom: 15px;
    }
    .credential-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .credential-value {
      color: #1e293b;
      font-size: 16px;
      font-family: 'Courier New', monospace;
      background-color: #ffffff;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .login-button {
      display: block;
      width: 100%;
      text-align: center;
      background-color: #e72d81;
      color: #ffffff;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      margin: 30px 0;
      transition: background-color 0.3s;
    }
    .login-button:hover {
      background-color: #d91a6f;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container" style="background-color: rgba(231, 45, 129, 0.2);">
      <div style="font-size: 36px; font-weight: bold; color: #e72d81; letter-spacing: 2px;">MDH</div>
    </div>
    
    <h1>Welkom bij Manege Duiksehoef Beheer</h1>
    <p class="subtitle">Je inloggegevens voor het beheersysteem</p>
    
    <p>Beste gebruiker,</p>
    
    <p>Hieronder vind je je inloggegevens voor het Manege Duiksehoef beheersysteem:</p>
    
    <div class="credentials-box">
      <div class="credential-item">
        <div class="credential-label">E-mailadres:</div>
        <div class="credential-value">${loginEmail}</div>
      </div>
      <div class="credential-item">
        <div class="credential-label">Wachtwoord:</div>
        <div class="credential-value">${loginPassword}</div>
      </div>
    </div>
    
    <div class="warning">
      <strong>⚠️ Belangrijk:</strong> Bewaar deze gegevens veilig en deel ze niet met anderen. Je kunt je wachtwoord later wijzigen in de instellingen.
    </div>
    
    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 30px 0;">
      <p style="color: #475569; font-size: 14px; margin-bottom: 15px; font-weight: 600;">Toegang tot het beheersysteem:</p>
      <p style="color: #1e293b; font-size: 15px; line-height: 1.8; margin-bottom: 12px;">
        Bezoek het beheersysteem via de volgende link:
      </p>
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
        <a href="${loginUrl}" style="color: #e72d81; font-size: 18px; font-weight: 600; text-decoration: none; word-break: break-all; display: inline-block; padding: 10px 20px; background-color: #f8fafc; border-radius: 8px;">${loginUrl}</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 10px;">Klik op de link hierboven om naar het beheersysteem te gaan</p>
      </div>
    </div>
    
    <p>Je kunt nu inloggen op het beheersysteem om alle functies te gebruiken, zoals:</p>
    <ul style="color: #475569; line-height: 2;">
      <li>Dashboard overzicht</li>
      <li>Lesplanning beheren</li>
      <li>Klantgegevens bekijken</li>
      <li>Financiële rapportages</li>
      <li>En nog veel meer...</li>
    </ul>
    
    <div class="footer">
      <p><strong>Manege Duikse Hoef</strong></p>
      <p>Duikse Hoef 1, 5175 PG Loon op Zand</p>
      <p>info@manegeduiksehoef.nl | +31 620685310</p>
    </div>
  </div>
</body>
</html>
    `;

    // Text versie
    const emailText = `
Welkom bij Manege Duiksehoef Beheer

Je inloggegevens voor het beheersysteem:

E-mailadres: ${loginEmail}
Wachtwoord: ${loginPassword}

⚠️ Belangrijk: Bewaar deze gegevens veilig en deel ze niet met anderen.

Toegang tot het beheersysteem:
Bezoek het beheersysteem via: ${loginUrl}
Klik op de link hierboven om naar het beheersysteem te gaan.

Je kunt nu inloggen op het beheersysteem om alle functies te gebruiken.

---
Manege Duikse Hoef
Duikse Hoef 1, 5175 PG Loon op Zand
info@manegeduiksehoef.nl | +31 620685310
    `;

    // Roep Supabase Edge Function aan
    console.log('📧 Versturen van email via Supabase Edge Function...');
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-email`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: 'Inloggegevens Manege Duiksehoef Beheersysteem',
        htmlBody: emailHtml,
        textBody: emailText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Email succesvol verstuurd!');
    console.log(`📧 Email gestuurd naar: ${recipientEmail}`);
    console.log(`📬 Response:`, result);
    console.log('\n📝 Email bevat:');
    console.log('   - Welkomstbericht');
    console.log(`   - Inloggegevens (email: ${loginEmail}, wachtwoord: ${loginPassword})`);

  } catch (error) {
    console.error('❌ Fout:', error.message);
    process.exit(1);
  }
}

sendAdminCredentials();

