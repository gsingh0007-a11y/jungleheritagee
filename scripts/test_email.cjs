
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnpvvcisithftraeykia.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY // Do not hardcode secrets

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testChatLead() {
    console.log('Testing send-notification-email edge function with CHAT_LEAD...')
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
            type: 'chat_lead',
            data: {
                name: 'Test Chat Lead',
                email: 'chat_test@example.com',
                phone: '+91 00000 00000',
                dates: '2026-03-01 to 2026-03-05',
                guests: '2 Guests'
            }
        }
    })

    if (error) {
        console.error('Error calling edge function:', error)
        try {
            const body = await error.context.json()
            console.error('Error body:', body)
        } catch (e) {
            // ignore
        }
    } else {
        console.log('Success response:', data)
    }
}

testChatLead()
