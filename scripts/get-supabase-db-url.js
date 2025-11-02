/**
 * Script untuk mendapatkan Database URL dari Supabase
 * Jalankan: node scripts/get-supabase-db-url.js
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

console.log('\n🔍 Supabase Database Connection Info');
console.log('=====================================\n');

console.log('📋 Your Project Reference:', projectRef);
console.log('\n');

console.log('📖 To get your Database URL:');
console.log('-----------------------------');
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
console.log('2. Scroll to "Connection string" section');
console.log('3. Select "URI" tab');
console.log('4. Copy the connection string\n');

console.log('🔐 Connection Pooler (Recommended for Serverless):');
console.log('---------------------------------------------------');
console.log('Mode: Transaction');
console.log('Format:');
console.log(`postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true\n`);

console.log('🔗 Direct Connection (For Migrations):');
console.log('---------------------------------------');
console.log(`postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres\n`);

console.log('⚠️  IMPORTANT:');
console.log('--------------');
console.log('Replace [YOUR-PASSWORD] with your database password');
console.log('(The password you set when creating the Supabase project)\n');

console.log('💡 Where to find your password:');
console.log('--------------------------------');
console.log('1. If you saved it during project creation, use that');
console.log('2. If lost, you can reset it at:');
console.log('   https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
console.log('   Click "Reset Database Password"\n');

console.log('📝 Update your .env.local:');
console.log('--------------------------');
console.log('DATABASE_URL="postgresql://postgres.' + projectRef + ':[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"');
console.log('DIRECT_URL="postgresql://postgres.' + projectRef + ':[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"\n');
