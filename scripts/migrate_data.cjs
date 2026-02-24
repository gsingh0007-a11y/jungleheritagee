import { createClient } from '@supabase/supabase-js'

const OLD_URL = 'YOUR_OLD_SUPABASE_URL'
const OLD_KEY = 'YOUR_OLD_SUPABASE_SERVICE_ROLE_KEY'

const NEW_URL = 'YOUR_NEW_SUPABASE_URL'
const NEW_KEY = 'YOUR_NEW_SUPABASE_SERVICE_ROLE_KEY'

const oldSupabase = createClient(OLD_URL, OLD_KEY)
const newSupabase = createClient(NEW_URL, NEW_KEY)

const TABLES = [
    'seasons',
    'room_categories',
    'packages',
    'meal_plan_prices',
    'tax_config',
    'resort_settings',
    'payment_settings',
    'channel_manager_settings',
    'blogs',
    'experiences',
    'knowledge_base',
    'bookings',
    'blocked_dates',
    'chat_leads',
    'chat_messages'
]

async function migrate() {
    for (const table of TABLES) {
        console.log(`Migrating table: ${table}...`)

        // Fetch from old
        const { data: oldData, error: fetchError } = await oldSupabase
            .from(table)
            .select('*')

        if (fetchError) {
            console.error(`Error fetching from ${table}:`, fetchError)
            continue
        }

        if (!oldData || oldData.length === 0) {
            console.log(`Table ${table} is empty. Skipping.`)
            continue
        }

        console.log(`Found ${oldData.length} records in ${table}. Inserting into new project...`)

        // Insert into new
        const { error: insertError } = await newSupabase
            .from(table)
            .upsert(oldData)

        if (insertError) {
            console.error(`Error inserting into ${table}:`, insertError)
        } else {
            console.log(`Successfully migrated ${table}.`)
        }
    }
}

migrate()
