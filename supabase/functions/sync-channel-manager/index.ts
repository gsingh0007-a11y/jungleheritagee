
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
        const { settings_id } = await req.json()

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch settings from database
        const { data: settings, error: settingsError } = await supabaseClient
            .from('channel_manager_settings')
            .select('*')
            .eq('id', settings_id)
            .single()

        if (settingsError || !settings) {
            throw new Error(`Channel manager settings not found: ${settingsError?.message}`)
        }

        const config = settings.config as any
        const provider = settings.provider

        // Log Sync Start
        await supabaseClient.from('channel_manager_logs').insert({
            event_type: 'sync_start',
            provider: provider,
            status: 'pending'
        })

        console.log(`Starting sync for ${provider} (Hotel ID: ${config.property_id || 'N/A'})...`)

        // 2. Mock external data (In production, replace with real API fetch using config.api_key)
        // Let's assume we fetch bookings from the last 30 days and next 90 days.
        const mockExternalBookings = [
            {
                room_category_slug: 'forest-villa',
                blocked_date: '2026-03-01',
                channel_manager_booking_id: 'ezee_bk_101'
            },
            {
                room_category_slug: 'forest-villa',
                blocked_date: '2026-03-02',
                channel_manager_booking_id: 'ezee_bk_101'
            }
        ]

        // 3. Map Slugs to Category IDs
        const { data: categories, error: catError } = await supabaseClient
            .from('room_categories')
            .select('id, slug')
        if (catError) throw catError

        let syncedCount = 0

        for (const extBooking of mockExternalBookings) {
            const category = categories.find(c => c.slug === extBooking.room_category_slug)
            if (!category) continue

            // 4. Find an available room for this category on this date
            const { data: availableRooms, error: availError } = await supabaseClient
                .rpc('get_available_rooms', {
                    _room_category_id: category.id,
                    _check_in: extBooking.blocked_date,
                    _check_out: extBooking.blocked_date // Just checking one date
                })

            // Wait, get_available_rooms uses check_out as exclusive (check_in <= date < check_out).
            // To check just one date, we need _check_out to be _check_in + 1 day.
            const checkInDate = new Date(extBooking.blocked_date)
            const checkOutDate = new Date(checkInDate)
            checkOutDate.setDate(checkInDate.getDate() + 1)
            const checkOutStr = checkOutDate.toISOString().split('T')[0]

            const { data: rooms, error: roomsError } = await supabaseClient
                .rpc('get_available_rooms', {
                    _room_category_id: category.id,
                    _check_in: extBooking.blocked_date,
                    _check_out: checkOutStr
                })

            if (roomsError) continue
            if (rooms && rooms.length > 0) {
                const targetRoomId = rooms[0].room_id

                // 5. Block the room
                const { error: blockError } = await supabaseClient
                    .from('blocked_dates')
                    .insert({
                        room_id: targetRoomId,
                        blocked_date: extBooking.blocked_date,
                        reason: 'booking',
                        source: 'channel_manager',
                        channel_manager_id: extBooking.channel_manager_booking_id,
                        notes: `Synced from ${provider}`
                    })

                if (!blockError) syncedCount++
            }
        }

        // 6. Update settings status
        await supabaseClient
            .from('channel_manager_settings')
            .update({
                last_sync_at: new Date().toISOString(),
                last_sync_status: 'success',
                last_error_message: null
            })
            .eq('id', settings_id)

        // Log Sync Success
        await supabaseClient.from('channel_manager_logs').insert({
            event_type: 'sync_success',
            provider: provider,
            payload: { synced_count: syncedCount },
            status: 'success'
        })

        return new Response(
            JSON.stringify({
                message: 'Sync completed successfully',
                synced_count: syncedCount
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Sync Error:', error)

        // Update settings error
        try {
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )
            // We might not have settings_id here if it failed early, but if we do, update it.
            // For now, just return the error.
        } catch (e) { }

        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
