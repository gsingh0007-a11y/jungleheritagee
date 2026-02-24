const fs = require('fs');
const sql = fs.readFileSync('scripts/create_schema.sql', 'utf8');

const tablesWithIsActive = new Set();
const tablesWithoutIsActive = new Set();

for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+)\s*\(([\s\S]+?)\);/g)) {
    if (m[2].includes('is_active')) tablesWithIsActive.add(m[1]);
    else tablesWithoutIsActive.add(m[1]);
}

let issues = 0;
for (const m of sql.matchAll(/CREATE POLICY "([^"]+)"\s*ON public\.(\w+)([\s\S]+?);/g)) {
    const polName = m[1], tbl = m[2], body = m[3];
    if (body.includes('is_active') && tablesWithoutIsActive.has(tbl)) {
        console.log('BAD: Policy [' + polName + '] on [' + tbl + '] uses is_active but table has no such column');
        issues++;
    }
}

if (issues === 0) console.log('ALL CLEAR: No stale is_active references in policies!');
console.log('Tables WITH is_active:', Array.from(tablesWithIsActive).sort().join(', '));
console.log('Tables WITHOUT is_active:', Array.from(tablesWithoutIsActive).sort().join(', '));
