# Supabase Email Template Aanpassen voor OTP Code

Om de OTP email eruit te laten zien zoals in de screenshot (met grote code in plaats van link), moet je de email template aanpassen in Supabase.

## Stappen:

1. **Ga naar Supabase Dashboard**
   - Open je Supabase project
   - Ga naar: **Authentication** > **Email Templates**
   - Link: https://supabase.com/dashboard/project/cdoadjyktlrgungskhvn/auth/templates

2. **Pas de "Magic Link" template aan**
   - Klik op **"Magic Link"** template
   - **Subject (Onderwerp)**: Vervang met: `Je inlogcode voor Manege Duikse Hoef`
   - **Body (Inhoud)**: Vervang met de HTML code hieronder

3. **Email Onderwerp (Subject):**
```
Je inlogcode voor Manege Duikse Hoef
```

4. **Email Inhoud (Body) - Gebruik deze professionele template:**

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #e72d81 0%, #ff6ba8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Manege Duikse Hoef
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
                Login code
              </h2>
              
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; text-align: center; line-height: 1.5;">
                Gebruik de onderstaande code om in te loggen op je account.
              </p>

              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, #fef2f8 0%, #ffeef6 100%); border: 2px solid #e72d81; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #e72d81; font-family: 'Courier New', monospace; line-height: 1.2;">
                  {{ .Token }}
                </div>
              </div>

              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; text-align: center;">
                Deze code verloopt over 20 minuten.
              </p>

              <!-- Security Warning -->
              <div style="background-color: #fff5f5; border-left: 4px solid #e72d81; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #c53030; font-size: 15px;">
                  ⚠️ Beveiligingswaarschuwing
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  Deel deze code <strong>NOOIT</strong> met anderen. Voer deze code alleen in op de officiële Manege Duikse Hoef website. Als iemand om deze code vraagt, kan dit een scam zijn.
                </p>
              </div>

              <!-- Footer Info -->
              <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0 0 5px 0; color: #999999; font-size: 12px; text-align: center;">
                  Deze login werd aangevraagd op {{ .RequestedAt }}
                </p>
                <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                  Email: {{ .Email }}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Met vriendelijke groet,
              </p>
              <p style="margin: 0; color: #e72d81; font-size: 16px; font-weight: 600;">
                Manege Duikse Hoef Team
              </p>
            </td>
          </tr>

        </table>

        <!-- Bottom Text -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Je ontvangt deze email omdat je een inlogcode hebt aangevraagd voor Manege Duikse Hoef.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
```

## Variabelen die beschikbaar zijn:

- `{{ .Token }}` - De 8-cijferige OTP code
- `{{ .Email }}` - Het email adres
- `{{ .RequestedAt }}` - Tijdstip van aanvraag
- `{{ .SiteURL }}` - Je website URL

## Belangrijk:

- Zorg dat "Enable email signups" is ingeschakeld in Authentication > Settings
- Test de template door een OTP code te versturen
- De code wordt automatisch vervangen door `{{ .Token }}`
- Deze template gebruikt inline CSS voor maximale email client compatibiliteit

## Design Features:

- ✅ Moderne, professionele layout
- ✅ Grote, duidelijke code (42px, monospace font)
- ✅ Pink/roze kleuren die matchen met Manege Duikse Hoef branding
- ✅ Beveiligingswaarschuwing in opvallende box
- ✅ Responsive design voor mobiel en desktop
- ✅ Goede spacing en typography
- ✅ Gradient header voor visuele impact
