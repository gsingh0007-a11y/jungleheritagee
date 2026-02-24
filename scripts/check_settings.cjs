
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnpvvcisithftraeykia.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // Do not hardcode secrets

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkSettings() {
    const { data: settings, error } = await supabase
        .from('resort_settings')
        .select('email')
        .single()

    if (error) {
        console.error('Error fetching settings:', error)
    } else {
        console.log('Current resort email in DB:', settings.email)
    }
}

checkSettings()
