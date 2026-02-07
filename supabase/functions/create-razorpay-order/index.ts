
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency = 'INR', receipt } = await req.json()

        // Initialize Razorpay
        // In production, use Deno.env.get('RAZORPAY_KEY_ID') etc.
        // For now putting placeholders or expecting env vars.
        const instance = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? 'rzp_test_placeholder',
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? 'start_secret_placeholder',
        });

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency,
            receipt,
            payment_capture: 1
        };

        console.log('Creating Razorpay order:', options);
        const order = await instance.orders.create(options);
        console.log('Order created:', order);

        return new Response(
            JSON.stringify(order),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error creating order:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
