// Script om betaalverzoeken te versturen met Mollie payment links
// Gebruik: node send-payment-request.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cdoadjyktlrgungskhvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2FkanlrdGxyZ3VuZ3NraHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTY3ODksImV4cCI6MjA4MTI3Mjc4OX0.YdYs_tc-v0wZC0hpyzAlRbjF88v5CVVXBvn3_hZ_gVc';

const emailAddresses = [
  { email: 'Diederik24@icloud.com', name: 'Diederik' },
  { email: 'diederikstraver1@gmail.com', name: 'Diederik Straver' },
  { email: 'continumd@gmail.com', name: 'Continuum' }
];

const paymentAmount = 0.01; // 0,1 cent (0.01 EUR = 1 cent, minimum voor Mollie)
const paymentDescription = 'Test betaalverzoek 0,01 euro';

async function createMolliePayment(customerEmail, customerName) {
  try {
    console.log(`💳 Mollie payment aanmaken voor ${customerName}...`);

    const paymentData = {
      amount: paymentAmount,
      description: paymentDescription,
      customerEmail: customerEmail,
      customerName: customerName,
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      console.error(`❌ Response:`, JSON.stringify(result, null, 2));
      throw new Error(result.error || result.message || `HTTP ${response.status}: Failed to create payment`);
    }

    if (result.success && result.paymentUrl) {
      console.log(`✅ Payment aangemaakt: ${result.paymentId}`);
      return result;
    } else {
      console.error(`❌ Payment creation failed:`, JSON.stringify(result, null, 2));
      throw new Error(result.error || 'Failed to create payment');
    }
  } catch (error) {
    console.error(`❌ Fout bij aanmaken payment:`, error.message);
    throw error;
  }
}

async function sendPaymentRequestEmail(customerEmail, customerName, paymentUrl) {
  try {
    console.log(`📧 Betaalverzoek email versturen naar ${customerEmail}...`);

    // Mooie betaalverzoek email layout
    const emailHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Betaalverzoek</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        p {
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .payment-info {
            background-color: #f9f9f9;
            border-left: 4px solid #E72D81;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .payment-amount {
            font-size: 32px;
            font-weight: bold;
            color: #E72D81;
            margin: 15px 0;
        }
        .button {
            display: inline-block;
            background-color: #E72D81;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #C2185B;
        }
        .link-text {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            word-break: break-all;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Betaalverzoek</h2>
        
        <p>Beste ${customerName},</p>
        
        <p>U heeft een betaalverzoek ontvangen voor:</p>
        
        <div class="payment-info">
            <p><strong>${paymentDescription}</strong></p>
            <div class="payment-amount">€ ${paymentAmount.toFixed(2)}</div>
        </div>
        
        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button">Betaal nu</a>
        </div>
        
        <p class="link-text">
            Of kopieer deze link in uw browser:<br>
            <a href="${paymentUrl}" style="color: #E72D81; word-break: break-all;">${paymentUrl}</a>
        </p>
        
        <div class="footer">
            <p>Manege Duiksehoef</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
Betaalverzoek

Beste ${customerName},

U heeft een betaalverzoek ontvangen voor:

${paymentDescription}

€ ${paymentAmount.toFixed(2)}

Betaal nu: ${paymentUrl}

Of kopieer deze link in uw browser:

${paymentUrl}

Manege Duiksehoef
    `;

    const emailData = {
      to: customerEmail,
      subject: 'Betaalverzoek - Manege Duikse Hoef',
      htmlBody: emailHtml,
      textBody: emailText,
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
      console.log(`✅ Email verstuurd naar ${customerEmail}`);
      return result;
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`❌ Fout bij versturen email:`, error.message);
    throw error;
  }
}

async function sendPaymentRequests() {
  console.log('💳 Betaalverzoeken aanmaken en versturen...\n');
  console.log(`Bedrag: €${paymentAmount.toFixed(2)}`);
  console.log(`Omschrijving: ${paymentDescription}\n`);
  console.log('Email adressen:', emailAddresses.map(e => e.email).join(', '));
  console.log('\n');

  const results = [];

  for (const recipient of emailAddresses) {
    try {
      console.log(`\n📬 Verwerken van ${recipient.name} (${recipient.email})...`);
      console.log('─'.repeat(50));

      // Stap 1: Maak Mollie payment aan
      const payment = await createMolliePayment(recipient.email, recipient.name);
      
      // Stap 2: Verstuur email met payment link
      const emailResult = await sendPaymentRequestEmail(
        recipient.email,
        recipient.name,
        payment.paymentUrl
      );

      results.push({
        email: recipient.email,
        name: recipient.name,
        success: true,
        paymentId: payment.paymentId,
        paymentUrl: payment.paymentUrl,
        messageId: emailResult.messageId,
      });

      console.log(`✅ Succesvol! Payment ID: ${payment.paymentId}`);
      console.log(`   Payment URL: ${payment.paymentUrl}`);
      console.log(`   Email Message ID: ${emailResult.messageId || 'N/A'}`);

    } catch (error) {
      console.error(`❌ Fout bij ${recipient.email}:`, error.message);
      results.push({
        email: recipient.email,
        name: recipient.name,
        success: false,
        error: error.message,
      });
    }
  }

  // Samenvatting
  console.log('\n\n📊 Samenvatting:');
  console.log('='.repeat(50));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Succesvol: ${successful}/${emailAddresses.length}`);
  console.log(`❌ Gefaald: ${failed}/${emailAddresses.length}`);

  if (successful > 0) {
    console.log('\n✅ Succesvolle betaalverzoeken:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.email})`);
      console.log(`    Payment ID: ${r.paymentId}`);
      console.log(`    Payment URL: ${r.paymentUrl}`);
    });
  }

  if (failed > 0) {
    console.log('\n❌ Gefaalde betaalverzoeken:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.email}): ${r.error}`);
    });
  }

  console.log('\n💡 Tip: Check je inbox (en spam folder) voor de betaalverzoek emails!');
  console.log('💡 Tip: De payment links leiden naar Mollie checkout waar je kunt betalen.');
}

sendPaymentRequests().catch(error => {
  console.error('❌ Onverwachte fout:', error);
  process.exit(1);
});

