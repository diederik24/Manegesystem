import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import mollieClient from 'https://esm.sh/@mollie/api-client@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests - MUST be first
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Log incoming request
    console.log('STEP: request_received');
    console.log('METHOD:', req.method);
    console.log('URL:', req.url);
    console.log('HEADERS:', Object.fromEntries(req.headers.entries()));

    // Check Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('STEP: content_type_check');
      console.log('ERROR: Missing or invalid Content-Type header');
      console.log('RECEIVED:', contentType || 'null');
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid Content-Type header. Expected: application/json',
          code: 'INVALID_CONTENT_TYPE',
          step: 'content_type_check'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Safely parse request body
    console.log('STEP: json_parse');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('SUCCESS: JSON parsed successfully');
      console.log('BODY:', JSON.stringify(requestBody));
    } catch (error) {
      console.log('ERROR: JSON parsing failed');
      console.log('ERROR_DETAILS:', error.message);
      console.log('ERROR_STACK:', error.stack);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          step: 'json_parse',
          details: error.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    console.log('STEP: field_validation');
    const { type, id, amount, description, customerEmail, customerName, redirectUrl } = requestBody;
    
    if (!type || !id || !amount || !description) {
      console.log('ERROR: Missing required fields');
      console.log('TYPE:', type || 'missing');
      console.log('ID:', id || 'missing');
      console.log('AMOUNT:', amount || 'missing');
      console.log('DESCRIPTION:', description || 'missing');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: type, id, amount, description',
          code: 'MISSING_FIELDS',
          step: 'field_validation'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('SUCCESS: All required fields present');

    // Strictly validate type field
    console.log('STEP: type_validation');
    if (type !== 'factuur' && type !== 'consumptie') {
      console.log('ERROR: Invalid type value');
      console.log('RECEIVED_TYPE:', type);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid type: must be "factuur" or "consumptie"',
          code: 'INVALID_TYPE',
          step: 'type_validation',
          received: type
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('SUCCESS: Type validation passed');

    // Safe amount handling
    console.log('STEP: amount_validation');
    const amountNumber = Number(amount);
    console.log('AMOUNT_RAW:', amount);
    console.log('AMOUNT_NUMBER:', amountNumber);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      console.log('ERROR: Invalid amount');
      console.log('AMOUNT_RAW:', amount);
      console.log('AMOUNT_NUMBER:', amountNumber);
      console.log('IS_NAN:', isNaN(amountNumber));
      console.log('IS_POSITIVE:', amountNumber > 0);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid amount: must be a positive number',
          code: 'INVALID_AMOUNT',
          step: 'amount_validation',
          received: amount
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('SUCCESS: Amount validation passed');

    // Environment variable validation
    console.log('STEP: env_validation');
    const mollieApiKey = Deno.env.get('MOLLIE_API_KEY');
    if (!mollieApiKey) {
      console.log('ERROR: MOLLIE_API_KEY missing');
      return new Response(
        JSON.stringify({ 
          error: 'MOLLIE_API_KEY not found in environment variables',
          code: 'MISSING_ENV_VAR',
          step: 'env_validation',
          missing: 'MOLLIE_API_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      console.log('ERROR: SUPABASE_URL missing');
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_URL not found in environment variables',
          code: 'MISSING_ENV_VAR',
          step: 'env_validation',
          missing: 'SUPABASE_URL'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
      console.log('ERROR: SUPABASE_SERVICE_ROLE_KEY missing');
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY not found in environment variables',
          code: 'MISSING_ENV_VAR',
          step: 'env_validation',
          missing: 'SUPABASE_SERVICE_ROLE_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mollieWebhookSecret = Deno.env.get('MOLLIE_WEBHOOK_SECRET');
    if (!mollieWebhookSecret) {
      console.log('ERROR: MOLLIE_WEBHOOK_SECRET missing');
      return new Response(
        JSON.stringify({ 
          error: 'MOLLIE_WEBHOOK_SECRET not found in environment variables',
          code: 'MISSING_ENV_VAR',
          step: 'env_validation',
          missing: 'MOLLIE_WEBHOOK_SECRET'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('SUCCESS: All environment variables present');

    // Initialize Mollie client
    console.log('STEP: mollie_init');
    const mollie = mollieClient({ apiKey: mollieApiKey });
    console.log('SUCCESS: Mollie client initialized');

    // Get Supabase client
    console.log('STEP: supabase_init');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('SUCCESS: Supabase client initialized');

    // Create payment in Mollie
    console.log('STEP: mollie_payment_create');
    console.log('PAYMENT_DATA:', JSON.stringify({
      amount: {
        currency: 'EUR',
        value: amountNumber.toFixed(2),
      },
      description: description,
      redirectUrl: redirectUrl || `${req.headers.get('origin') || 'http://localhost:5000'}/payment-success`,
      webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook?secret=${mollieWebhookSecret}`,
      metadata: {
        type: type,
        id: id,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
    }));

    let payment;
    try {
      payment = await mollie.payments.create({
        amount: {
          currency: 'EUR',
          value: amountNumber.toFixed(2),
        },
        description: description,
        redirectUrl: redirectUrl || `${req.headers.get('origin') || 'http://localhost:5000'}/payment-success`,
        webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook?secret=${mollieWebhookSecret}`,
        metadata: {
          type: type,
          id: id,
          customerEmail: customerEmail || '',
          customerName: customerName || '',
        },
      });
      console.log('SUCCESS: Mollie payment created');
      console.log('PAYMENT_ID:', payment.id);
      console.log('PAYMENT_STATUS:', payment.status);
    } catch (error) {
      console.log('ERROR: Mollie payment creation failed');
      console.log('ERROR_MESSAGE:', error.message);
      console.log('ERROR_STACK:', error.stack);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create Mollie payment: ${error.message}`,
          code: 'MOLLIE_ERROR',
          step: 'mollie_payment_create',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Safe checkout URL handling
    console.log('STEP: checkout_url_validation');
    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      console.log('ERROR: No checkout URL returned');
      console.log('PAYMENT_ID:', payment.id);
      console.log('PAYMENT_STATUS:', payment.status);
      return new Response(
        JSON.stringify({ 
          error: 'Mollie payment created but no checkout URL returned',
          code: 'NO_CHECKOUT_URL',
          step: 'checkout_url_validation',
          paymentId: payment.id
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('SUCCESS: Checkout URL obtained');

    // Save payment ID to database
    console.log('STEP: database_update');
    if (type === 'factuur') {
      console.log('UPDATING: transactions table');
      console.log('TRANSACTION_ID:', id);
      console.log('MOLLIE_PAYMENT_ID:', payment.id);
      
      const { data, error: transactionError } = await supabaseClient
        .from('transactions')
        .update({ mollie_payment_id: payment.id })
        .eq('id', id)
        .select();

      if (transactionError) {
        console.log('ERROR: Transaction update failed');
        console.log('ERROR_MESSAGE:', transactionError.message);
        console.log('ERROR_CODE:', transactionError.code);
        console.log('ERROR_DETAILS:', transactionError.details);
        return new Response(
          JSON.stringify({ 
            error: `Failed to update transaction: ${transactionError.message}`,
            code: 'DATABASE_ERROR',
            step: 'database_update',
            table: 'transactions',
            details: transactionError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data || data.length === 0) {
        console.log('ERROR: No rows updated');
        console.log('TRANSACTION_ID:', id);
        return new Response(
          JSON.stringify({ 
            error: `Transaction with id ${id} not found or could not be updated`,
            code: 'NOT_FOUND',
            step: 'database_update',
            table: 'transactions',
            id: id
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.log('SUCCESS: Transaction updated');
      console.log('UPDATED_ROWS:', data.length);
    } else if (type === 'consumptie') {
      console.log('UPDATING: consumptie_kaarten table');
      console.log('CONSUMPTIE_ID:', id);
      console.log('MOLLIE_PAYMENT_ID:', payment.id);
      
      const { data, error: consumptieError } = await supabaseClient
        .from('consumptie_kaarten')
        .update({ mollie_payment_id: payment.id })
        .eq('id', id)
        .select();

      if (consumptieError) {
        console.log('ERROR: Consumptie kaart update failed');
        console.log('ERROR_MESSAGE:', consumptieError.message);
        console.log('ERROR_CODE:', consumptieError.code);
        console.log('ERROR_DETAILS:', consumptieError.details);
        return new Response(
          JSON.stringify({ 
            error: `Failed to update consumptie kaart: ${consumptieError.message}`,
            code: 'DATABASE_ERROR',
            step: 'database_update',
            table: 'consumptie_kaarten',
            details: consumptieError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data || data.length === 0) {
        console.log('ERROR: No rows updated');
        console.log('CONSUMPTIE_ID:', id);
        return new Response(
          JSON.stringify({ 
            error: `Consumptie kaart with id ${id} not found or could not be updated`,
            code: 'NOT_FOUND',
            step: 'database_update',
            table: 'consumptie_kaarten',
            id: id
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.log('SUCCESS: Consumptie kaart updated');
      console.log('UPDATED_ROWS:', data.length);
    }

    // Return payment URL
    console.log('STEP: success_response');
    console.log('PAYMENT_URL:', checkoutUrl);
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        paymentUrl: checkoutUrl,
        status: payment.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.log('STEP: unhandled_error');
    console.log('ERROR_MESSAGE:', error.message);
    console.log('ERROR_STACK:', error.stack);
    console.log('ERROR_NAME:', error.name);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment',
        code: 'UNHANDLED_ERROR',
        step: 'unhandled_error',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
