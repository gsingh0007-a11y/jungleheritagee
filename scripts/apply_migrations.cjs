const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function runMigrations() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to the new database.');

        const files = fs.readdirSync(migrationDir).sort();
        console.log(`Found ${files.length} migration files.`);

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Running migration: ${file}...`);
                const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');

                // Handle basic schema setup. Some migrations might fail if enums already exist, 
                // but for a fresh project, this should be fine.
                try {
                    await client.query(sql);
                    console.log(`Successfully applied ${file}.`);
                } catch (err) {
                    console.error(`Error applying ${file}:`, err.message);
                    // We continue because some migrations might have overlapping logic or small errors
                }
            }
        }

        console.log('All migrations processed.');
    } catch (err) {
        console.error('Migration failed:', err.stack);
    } finally {
        await client.end();
    }
}

runMigrations();
