/**
 * generate_data_transfer.cjs
 * Creates a SQL script that uses postgres_fdw (Foreign Data Wrapper)
 * to transfer data from the OLD Supabase project to the NEW project.
 * It will output `transfer_data.sql`.
 */
const fs = require('fs');
const path = require('path');

const creationFile = path.join(__dirname, 'create_schema.sql');
const outFile = path.join(__dirname, 'transfer_data.sql');

if (!fs.existsSync(creationFile)) {
    console.error("Missing create_schema.sql. Please run generate_schema.cjs first.");
    process.exit(1);
}

const rawSchema = fs.readFileSync(creationFile, 'utf8');

// Extract the topological order of tables
const tables = [];
const tableRe = /CREATE TABLE IF NOT EXISTS public\.(\w+)/gi;
for (const m of rawSchema.matchAll(tableRe)) {
    tables.push(m[1]);
}

let sql = `-- STEP 3: DATA TRANSFER VIA FOREIGN DATA WRAPPER
-- Connects the old database and pulls data directly into the new database tables.

-- WARNING: YOU MUST REPLACE THESE VALUES WITH THE OLD PROD DB CREDENTIALS
-- Old DB Host: aws-0-ap-south-1.pooler.supabase.com (or similar)
-- Old DB Port: 6543 (transaction) or 5432 (session)
-- Old DB Name: postgres
-- Old DB User: postgres.imlbvvxyxlknevvlbbpr
-- Old DB Pass: YOUR_OLD_DB_PASSWORD

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 1. Create the server connection (Replace with actual OLD DB Host/Port/Name)
CREATE SERVER IF NOT EXISTS old_prod_db
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'aws-0-ap-south-1.pooler.supabase.com', port '6543', dbname 'postgres');

-- 2. Map the current user (postgres) to the remote user
-- REPLACE 'YOUR_OLD_DB_PASSWORD' below with the actual old project pg password
CREATE USER MAPPING IF NOT EXISTS FOR postgres
  SERVER old_prod_db
  OPTIONS (user 'postgres.imlbvvxyxlknevvlbbpr', password 'YOUR_OLD_DB_PASSWORD');

-- 3. Create a schema for the foreign tables to reside in
CREATE SCHEMA IF NOT EXISTS old_public;

-- 4. Import the foreign schema
IMPORT FOREIGN SCHEMA public
  FROM SERVER old_prod_db
  INTO old_public;

-- 5. Disable Triggers to avoid firing side effects (like updated_at or email sending) during import
SET session_replication_role = 'replica';

-- 6. Insert data for all tables in topological order
`;

for (const tbl of tables) {
    sql += `
-- Transfer ${tbl}
INSERT INTO public.${tbl}
SELECT * FROM old_public.${tbl}
ON CONFLICT DO NOTHING;
`;
}

sql += `
-- 7. Re-enable Triggers
SET session_replication_role = 'origin';

-- 8. Clean up Foreign Data Wrapper
DROP SCHEMA IF EXISTS old_public CASCADE;
DROP USER MAPPING IF EXISTS FOR postgres SERVER old_prod_db;
DROP SERVER IF EXISTS old_prod_db CASCADE;

-- DATA TRANSFER COMPLETE!
`;

fs.writeFileSync(outFile, sql);
console.log(`Wrote ${outFile}`);
console.log('\nInstructions for user:');
console.log('1. Open transfer_data.sql');
console.log('2. Replace the connection OPTION string block and the YOUR_OLD_DB_PASSWORD text with the original database password.');
console.log('3. Run the script in the NEW Supabase project.');
