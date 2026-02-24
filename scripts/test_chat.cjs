
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnpvvcisithftraeykia.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY // Do not hardcode secrets

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testChat() {
    console.log('Testing chat-assistant edge function...')
    const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
            messages: [{ role: 'user', content: 'Hello' }],
            sessionId: 'test-session-' + Date.now()
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

testChat()
