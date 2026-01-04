import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import nodemailer from 'npm:nodemailer@6.9.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, htmlBody, textBody, testMode = false } = body;

    // Get Gmail credentials from Supabase Secrets
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gmail credentials not found in Supabase Secrets. Zorg dat GMAIL_USER en GMAIL_PASSWORD zijn ingesteld.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Gmail credentials found:', { gmailUser });

    // Maak Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    // Voor test mode, maak een test email
    if (testMode || !to) {
      const testTo = to || gmailUser; // Stuur naar jezelf als test
      const testSubject = subject || 'Test Email - Manege Duikse Hoef';
      const testHtml = htmlBody || `
        <h2>Test Email van Manege Duikse Hoef</h2>
        <p>Dit is een test email om te controleren of Gmail configuratie werkt.</p>
        <p>Als je deze email ontvangt, werkt de Gmail configuratie correct!</p>
        <p><strong>Gmail User:</strong> ${gmailUser}</p>
        <p><strong>Tijdstip:</strong> ${new Date().toLocaleString('nl-NL')}</p>
      `;

      const testText = textBody || `
Test Email van Manege Duikse Hoef

Dit is een test email om te controleren of Gmail configuratie werkt.
Als je deze email ontvangt, werkt de Gmail configuratie correct!

Gmail User: ${gmailUser}
Tijdstip: ${new Date().toLocaleString('nl-NL')}
      `;

      const mailOptions = {
        from: `"Manege Duikse Hoef" <${gmailUser}>`,
        to: testTo,
        subject: testSubject,
        text: testText,
        html: testHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Test email sent:', info.messageId);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Test email succesvol verstuurd naar ${testTo}`,
          messageId: info.messageId,
          testMode: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verstuur normale email
    if (!to || !subject) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'To en subject zijn verplicht',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mailOptions = {
      from: `"Manege Duikse Hoef" <${gmailUser}>`,
      to: to,
      subject: subject,
      text: textBody || '',
      html: htmlBody || textBody || '',
      headers: {
        'List-Unsubscribe': `<mailto:${gmailUser}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Manege Duikse Hoef System',
        'X-Priority': '1',
        'Importance': 'normal',
      },
      // Voeg reply-to toe
      replyTo: gmailUser,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email succesvol verstuurd naar ${to}`,
        messageId: info.messageId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
