/**
 * Script untuk generate connection string yang benar
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

console.log('\n🔧 Fix Connection String\n');
console.log('================================\n');

console.log('📋 Your Project Info:');
console.log('---------------------');
console.log('Project Ref:', projectRef);
console.log('Region: ap-southeast-1 (Singapore)\n');

console.log('❌ CURRENT (Probably Wrong):');
console.log('----------------------------');
console.log('DATABASE_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/..."');
console.log('DIRECT_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/..."\n');

console.log('✅ CORRECT FORMAT:');
console.log('------------------\n');

console.log('Copy dan paste ini ke file .env:\n');

console.log('# For runtime (pooled connection)');
console.log(`DATABASE_URL="postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"\n`);

console.log('# For migrations/prisma push (direct connection)');
console.log(`DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres"\n`);

console.log('⚠️  KEY DIFFERENCES:');
console.log('-------------------');
console.log('1. DATABASE_URL: Keep "postgres.[ref]" prefix');
console.log('2. DIRECT_URL: Use "postgres@db.[ref].supabase.co" (no prefix on postgres!)\n');

console.log('🔐 To Get Correct Connection String from Dashboard:');
console.log('---------------------------------------------------');
console.log(`1. Visit: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('2. Look for "Connection string" section');
console.log('3. Select "URI" tab');
console.log('4. You\'ll see TWO connection strings:');
console.log('   - Connection pooling (port 6543) → use for DATABASE_URL');
console.log('   - Direct connection (port 5432) → use for DIRECT_URL\n');

console.log('📝 Example with password "BismillahLancar45":');
console.log('----------------------------------------------\n');

const examplePassword = 'BismillahLancar45';
console.log(`DATABASE_URL="postgresql://postgres.${projectRef}:${examplePassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"`);
console.log(`DIRECT_URL="postgresql://postgres:${examplePassword}@db.${projectRef}.supabase.co:5432/postgres"\n`);

console.log('================================\n');
console.log('After updating .env, run:');
console.log('  npm run prisma:push\n');
