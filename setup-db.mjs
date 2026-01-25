import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://xecdhsnfxaejwkyrvhca.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlY2Roc25meGFlandreXJ2aGNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI0MTQyOCwiZXhwIjoyMDgzODE3NDI4fQ.vMlFwImZjiaVz_cQsJjKDMmVBWBKbnqemijwTwNdkfI';

async function runSchema() {
  const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split into individual statements
  const statements = schema
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log(`  Warning: ${text}`);
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log('\\nDone!');
}

runSchema();
