# Mollie Payment Integratie Setup

## Overzicht

Deze applicatie heeft Mollie payment integratie voor:
- **Facturen** (via Finance component)
- **Consumptiekaarten** (via Consumptie component)

## Stap 1: Supabase Secrets Configureren ✅

Het `MOLLIE_API_KEY` secret is al toegevoegd in Supabase.

## Stap 2: Edge Functions Deployen

### Vereisten
- Supabase CLI geïnstalleerd: `npm install -g supabase`
- Ingelogd in Supabase CLI: `supabase login`

### Deploy Commands

```bash
# Deploy create-payment function
supabase functions deploy create-payment

# Deploy mollie-webhook function
supabase functions deploy mollie-webhook
```

### Alternatief: Via Supabase Dashboard

1. Ga naar: https://supabase.com/dashboard/project/cdoadjyktlrgungskhvn/functions
2. Upload de Edge Functions handmatig:
   - `supabase/functions/create-payment/index.ts`
   - `supabase/functions/mollie-webhook/index.ts`

## Stap 3: Webhook URL Configureren in Mollie

Na het deployen krijg je een webhook URL zoals:
```
https://cdoadjyktlrgungskhvn.supabase.co/functions/v1/mollie-webhook
```

### In Mollie Dashboard:

1. Ga naar: https://my.mollie.com/dashboard/developers/webhooks
2. Klik op "Add webhook"
3. Voer de webhook URL in:
   ```
   https://cdoadjyktlrgungskhvn.supabase.co/functions/v1/mollie-webhook
   ```
4. Selecteer events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `payment.canceled`
   - ✅ `payment.expired`
5. Klik "Save"

## Stap 4: Testen

### Test Payment Flow:

1. **Factuur betaling:**
   - Ga naar Finance → Selecteer een factuur
   - Klik "Betaal nu"
   - Je wordt doorgestuurd naar Mollie checkout
   - Test betaling met Mollie test cards

2. **Consumptiekaart betaling:**
   - Ga naar Consumptie → Selecteer een kaart
   - Klik "Betaal nu"
   - Je wordt doorgestuurd naar Mollie checkout

### Mollie Test Cards:

- **iDEAL:** Gebruik test bank "Test Bank"
- **Creditcard:** Gebruik test nummer `4111111111111111`
- **Vervaldatum:** Elke toekomstige datum
- **CVC:** Elke 3 cijfers

## Stap 5: Live API Key (Productie)

Wanneer je klaar bent voor productie:

1. Voeg Live API Key toe aan Supabase Secrets:
   - Name: `MOLLIE_API_KEY`
   - Value: Je Live API Key (begint met `live_`)

2. Update webhook URL in Mollie naar productie URL

3. Test opnieuw met echte betalingen

## Troubleshooting

### Edge Function errors:
- Check Supabase Functions logs: Dashboard → Edge Functions → Logs
- Controleer of `MOLLIE_API_KEY` secret correct is ingesteld

### Webhook niet werkt:
- Controleer webhook URL in Mollie
- Check Supabase Functions logs voor errors
- Test webhook met Mollie's webhook tester

### Payment niet aangemaakt:
- Check browser console voor errors
- Controleer Supabase Edge Functions logs
- Verify dat `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` zijn ingesteld

## Support

Voor vragen over:
- **Mollie:** https://help.mollie.com
- **Supabase:** https://supabase.com/docs




