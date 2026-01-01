import { supabase } from './supabase';

export interface CreatePaymentParams {
  type: 'factuur' | 'consumptie';
  id: string;
  amount: number;
  description: string;
  customerEmail?: string;
  customerName?: string;
  redirectUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  status: string;
  error?: string;
}

/**
 * Create a Mollie payment via Supabase Edge Function
 */
export async function createMolliePayment(params: CreatePaymentParams): Promise<PaymentResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        type: params.type,
        id: params.id,
        amount: params.amount,
        description: params.description,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        // Don't override redirectUrl - let the Edge Function use the default (https://www.manegeduiksehoef.nl)
        // Only use custom redirectUrl if explicitly provided
        ...(params.redirectUrl && { redirectUrl: params.redirectUrl }),
      },
    });

    if (error) {
      console.error('Error creating payment:', error);
      return {
        success: false,
        paymentId: '',
        paymentUrl: '',
        status: 'error',
        error: error.message || 'Failed to create payment',
      };
    }

    return data as PaymentResponse;
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      paymentId: '',
      paymentUrl: '',
      status: 'error',
      error: error.message || 'Failed to create payment',
    };
  }
}

