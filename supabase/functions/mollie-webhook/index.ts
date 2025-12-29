import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MollieClient } from 'https://esm.sh/@mollie/api-client@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify webhook secret
  const url = new URL(req.url);
  const webhookSecret = Deno.env.get('MOLLIE_WEBHOOK_SECRET');
  if (webhookSecret) {
    const secretParam = url.searchParams.get('secret');
    if (secretParam !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  try {
    // Get Mollie API key from secrets
    const mollieApiKey = Deno.env.get('MOLLIE_API_KEY');
    if (!mollieApiKey) {
      throw new Error('MOLLIE_API_KEY not found in environment variables');
    }

    // Initialize Mollie client
    const mollieClient = new MollieClient({ apiKey: mollieApiKey });

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get payment ID from query string or body
    const paymentId = url.searchParams.get('id') || (await req.json()).id;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get payment status from Mollie
    const payment = await mollieClient.payments.get(paymentId);

    // Get metadata to determine type and ID
    const metadata = payment.metadata as { type?: string; id?: string };
    const type = metadata?.type;
    const id = metadata?.id;

    if (!type || !id) {
      console.error('Missing metadata in payment:', paymentId);
      return new Response(
        JSON.stringify({ error: 'Missing metadata in payment' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update database based on payment status
    if (payment.status === 'paid') {
      if (type === 'factuur') {
        // Update transaction status to 'Betaald'
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .update({
            status: 'Betaald',
            mollie_payment_id: payment.id,
          })
          .eq('id', id);

        if (transactionError) {
          console.error('Error updating transaction:', transactionError);
          throw transactionError;
        }

        // Also update facturen table if it exists
        const { error: factuurError } = await supabaseClient
          .from('facturen')
          .update({
            status: 'Betaald',
            betaaldOp: new Date().toISOString(),
            mollie_payment_id: payment.id,
          })
          .eq('id', id);

        if (factuurError && factuurError.code !== 'PGRST116') {
          // PGRST116 = table doesn't exist, which is okay
          console.error('Error updating factuur:', factuurError);
        }
      } else if (type === 'consumptie') {
        // Update consumptie kaart status to 'betaald'
        const { error: consumptieError } = await supabaseClient
          .from('consumptie_kaarten')
          .update({
            status: 'betaald',
            mollie_payment_id: payment.id,
          })
          .eq('id', id);

        if (consumptieError) {
          console.error('Error updating consumptie kaart:', consumptieError);
          throw consumptieError;
        }
      }
    } else if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      // Optionally handle failed payments
      console.log(`Payment ${paymentId} status: ${payment.status}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        status: payment.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process webhook' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

