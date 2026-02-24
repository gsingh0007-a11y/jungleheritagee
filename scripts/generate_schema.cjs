/**
 * generate_schema.cjs  (v6)
 *
 * Key improvements over v5:
 *  - TABLE-FILE-INDEX TRACKING: every table definition records which migration
 *    file (by sort index) it came from.
 *  - STALE POLICY FILTERING: a policy is only kept if it was last seen in a
 *    migration file >= the file that last defined its table. This prevents old
 *    policies (e.g. "USING (is_active = true)") from being applied to tables
 *    that were later redefined without that column.
 *  - ALTER TABLE ADD COLUMN columns are MERGED into the CREATE TABLE body to
 *    avoid "column already exists" errors.
 *  - Topological sort of tables by FK dependency.
 */
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const cleanupFile = path.join(__dirname, 'cleanup_schema.sql');
const creationFile = path.join(__dirname, 'create_schema.sql');

const files = fs.readdirSync(migrationsDir).sort();

// ── Collectors ────────────────────────────────────────────────────────────────
const lastTableDef = new Map(); // name  → { body, refs, fileIdx }
const lastTypeDef = new Map(); // name  → { values }
const lastPolicyDef = new Map(); // key   → { sql, fileIdx }
const lastTriggerDef = new Map(); // key   → { name, table, body }
const lastFuncDef = new Map(); // name  → sql
// ALTER ADD COLUMN: tableName → Map<colName, colDefStr>
const alterAddCols = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractFKTables(body) {
    const refs = new Set();
    const re = /REFERENCES\s+(?:public\.)?(\w+)\s*\(/gi;
    let m;
    while ((m = re.exec(body)) !== null) refs.add(m[1]);
    return refs;
}

function extractColumnNames(body) {
    const cols = new Set();
    const SKIP = new Set(['CONSTRAINT', 'UNIQUE', 'PRIMARY', 'FOREIGN', 'CHECK', 'EXCLUDE']);
    for (const m of body.matchAll(/^\s+(\w+)\s+\w/gm)) {
        if (!SKIP.has(m[1].toUpperCase())) cols.add(m[1].toLowerCase());
    }
    return cols;
}

function wrapEnum(name, values) {
    const vals = values.map(v => `'${v.trim().replace(/'/g, "")}'`).join(', ');
    return `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = '${name}' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.${name} AS ENUM (${vals});
    END IF;
END $$;`;
}

// ── Phase 1 – Parse every migration file ─────────────────────────────────────
for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    if (!file.endsWith('.sql')) continue;
    const raw = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // TYPES
    for (const m of raw.matchAll(/CREATE TYPE\s+(?:public\.)?(\w+)\s+AS\s+ENUM\s*\(([^)]+?)\)\s*;/gis)) {
        lastTypeDef.set(m[1], { values: m[2].split(',').map(v => v.trim().replace(/'/g, '')) });
    }

    // TABLES – record the file index of the last definition
    for (const m of raw.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]+?)\)\s*;/gi)) {
        lastTableDef.set(m[1], { body: m[2], refs: extractFKTables(m[2]), fileIdx: fi });
    }

    // POLICIES – public schema only, record file index
    for (const m of raw.matchAll(/CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)([\s\S]+?);/gi)) {
        const key = `${m[2]}|${m[1]}`;
        lastPolicyDef.set(key, {
            sql: `CREATE POLICY "${m[1]}"\nON public.${m[2]}${m[3]};`,
            fileIdx: fi
        });
    }

    // TRIGGERS – require BEFORE|AFTER|INSTEAD timing keyword, must start line
    const triggerRe = /^\s*CREATE\s+TRIGGER\s+(\w+)\s+(?:BEFORE|AFTER|INSTEAD\s+OF)\s+[\s\S]+?ON\s+(?:public\.)?(\w+)\s+[\s\S]+?EXECUTE\s+\w+[^;]+;/gim;
    for (const m of raw.matchAll(triggerRe)) {
        if (m[1] === 'trigger_set_booking_reference') continue; // Skip obsolete trigger that calls obsolete function
        lastTriggerDef.set(`${m[2]}|${m[1]}`, { name: m[1], table: m[2], body: m[0] });
    }

    // FUNCTIONS - must start line
    const funcRe = /^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)[\s\S]+?\$\$[\s\S]+?\$\$[^;]*;/gim;
    for (const m of raw.matchAll(funcRe)) {
        if (m[1] === 'set_booking_reference') continue; // Skip obsolete broken function replaced by direct trigger
        console.log(`[DEBUG] Captured function: ${m[1]} from ${file}`);
        lastFuncDef.set(m[1], m[0].replace(/^\s*CREATE\s+FUNCTION/im, 'CREATE OR REPLACE FUNCTION'));
    }

    // ALTER TABLE ADD COLUMN
    const alterRe = /ALTER TABLE\s+(?:public\.)?(\w+)\s+(ADD COLUMN[\s\S]+?);(?=\s*(?:--|\n|$|ALTER|CREATE|DROP|UPDATE|DELETE|INSERT|\z))/gi;
    for (const m of raw.matchAll(alterRe)) {
        const tbl = m[1];
        if (!alterAddCols.has(tbl)) alterAddCols.set(tbl, new Map());
        const colMap = alterAddCols.get(tbl);
        for (const part of m[2].split(/,(?=\s*ADD\s+COLUMN)/gi)) {
            const cm = part.match(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)([\s\S]+)/i);
            if (cm) colMap.set(cm[1].toLowerCase(), cm[2].trim());
        }
    }
}

// ── Phase 1b – Stale policy pruning ──────────────────────────────────────────
// Drop any policy whose last occurrence predates the table's last definition.
let prunedCount = 0;
for (const [key, { fileIdx: policyFi }] of [...lastPolicyDef]) {
    const tableName = key.split('|')[0];
    const tableDef = lastTableDef.get(tableName);
    if (tableDef && policyFi < tableDef.fileIdx) {
        lastPolicyDef.delete(key);
        prunedCount++;
        const policyName = key.split('|').slice(1).join('|');
        console.log(`  Pruned stale policy "${policyName}" on ${tableName} (policy file ${policyFi} < table file ${tableDef.fileIdx})`);
    }
}
console.log(`  Pruned ${prunedCount} stale policies total.`);

// ── Phase 1c – Merge ALTER ADD COLUMN into table bodies ──────────────────────
for (const [tbl, colMap] of alterAddCols) {
    const def = lastTableDef.get(tbl);
    if (!def) continue;
    const existing = extractColumnNames(def.body);
    let body = def.body;
    for (const [colName, colDef] of colMap) {
        if (!existing.has(colName)) {
            body = body.trimEnd().replace(/,?\s*$/, '') + `,\n    ${colName} ${colDef}`;
            existing.add(colName);
            console.log(`  Merged col "${colName}" into ${tbl}`);
        } else {
            console.log(`  Skipped dup col "${colName}" in ${tbl}`);
        }
    }
    def.body = body;
    def.refs = extractFKTables(body);
}

// ── Phase 2 – Topological sort by FK dependency ───────────────────────────────
const visited = new Set(), ordered = [];
function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    const def = lastTableDef.get(name);
    if (def) for (const ref of def.refs) if (lastTableDef.has(ref)) visit(ref);
    ordered.push(name);
}
for (const name of lastTableDef.keys()) visit(name);

// ── Phase 3 – Write cleanup_schema.sql ────────────────────────────────────────
let cleanup = '-- STEP 1: CLEANUP\nDO $$ BEGIN\n';
for (const t of [...ordered].reverse()) cleanup += `    DROP TABLE IF EXISTS public.${t} CASCADE;\n`;
for (const tp of [...lastTypeDef.keys()].reverse()) cleanup += `    DROP TYPE IF EXISTS public.${tp} CASCADE;\n`;
cleanup += 'END $$;\n';
fs.writeFileSync(cleanupFile, cleanup);

// ── Phase 4 – Write create_schema.sql ─────────────────────────────────────────
let out = '-- STEP 2: SCHEMA CREATION (squashed, topo-sorted, stale-policy-pruned)\n\n';
out += 'CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;\n\n';

out += '-- ====== TYPES ======\n';
for (const [name, { values }] of lastTypeDef) out += wrapEnum(name, values) + '\n\n';

out += '-- ====== TABLES ======\n';
for (const name of ordered) {
    const { body } = lastTableDef.get(name);
    out += `CREATE TABLE IF NOT EXISTS public.${name} (\n${body}\n);\n\n`;
}

out += '-- ====== FUNCTIONS ======\n';
for (const [, body] of lastFuncDef) out += body + '\n\n';

out += '-- ====== ENABLE RLS ======\n';
for (const name of ordered) out += `ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;\n`;
out += '\n';

out += '-- ====== POLICIES ======\n';
for (const [, { sql }] of lastPolicyDef) out += sql + '\n\n';

out += '-- ====== TRIGGERS ======\n';
for (const [, { name, table, body }] of lastTriggerDef) {
    out += `DROP TRIGGER IF EXISTS ${name} ON public.${table};\n`;
    out += body + '\n\n';
}

fs.writeFileSync(creationFile, out);

console.log('\nWrote', cleanupFile);
console.log('Wrote', creationFile);
console.log('Tables:', ordered.join(' → '));
