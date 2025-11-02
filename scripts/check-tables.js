/**
 * Simple script to check if tables exist
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  console.log('\n🔍 Checking Tables...\n');
  
  const tables = ['brands', 'assets', 'presets', 'projects', 'posters', 'compositions', 'outputs', 'audit_logs'];
  
  let foundCount = 0;
  
  for (const table of tables) {
    const { data, error } = await supabaseAdmin.from(table).select('id').limit(1);
    
    if (!error) {
      console.log(`✅ ${table}`);
      foundCount++;
    } else {
      console.log(`❌ ${table} - Not found`);
    }
  }
  
  console.log(`\n📊 Result: ${foundCount}/${tables.length} tables found\n`);
  
  if (foundCount === 0) {
    console.log('⚠️  No tables found! You need to run the SQL script.\n');
    console.log('📝 Steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor');
    console.log('2. Copy all content from: scripts/create-tables-safe.sql');
    console.log('3. Paste in SQL Editor');
    console.log('4. Click "Run" (or press F5)\n');
  } else if (foundCount < tables.length) {
    console.log('⚠️  Some tables are missing. Run the SQL script again.\n');
  } else {
    console.log('🎉 All tables exist! Setup complete!\n');
    console.log('Next: npm run dev\n');
  }
}

checkTables();
