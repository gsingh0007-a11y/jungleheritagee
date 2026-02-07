
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Webhooks typically send a payload with booking changes
        // eZee Centrix might send XML or JSON depending on configuration
        // For this implementation, we assume JSON
        const payload = await req.json()

        // Log the webhook arrival
        await supabaseClient.from('channel_manager_logs').insert({
            event_type: 'webhook',
            provider: 'ezee',
            payload: payload,
            status: 'received'
        })

        console.log('Received Webhook Payload:', JSON.stringify(payload))

        // Process the webhook payload
        // Example logic: if payload contains a booking update, trigger a sync for that specific property
        // For simplicity, we trigger the full sync function for the property

        // Find the property ID from the payload (vendor specific)
        const propertyId = payload.HotelCode || payload.property_id

        if (propertyId) {
            const { data: settings } = await supabaseClient
                .from('channel_manager_settings')
                .select('id')
                .contains('config', { property_id: propertyId.toString() })
                .single()

            if (settings) {
                // Invoke the sync function
                await supabaseClient.functions.invoke('sync-channel-manager', {
                    body: { settings_id: settings.id }
                })
            }
        }

        return new Response(
            JSON.stringify({ status: 'success', message: 'Webhook processed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
