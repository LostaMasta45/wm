/**
 * Script untuk setup database Supabase dengan Prisma
 * Jalankan: node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Supabase Database Setup\n');
console.log('================================\n');

console.log('⚠️  PASTIKAN sudah update DATABASE_URL di .env.local!\n');

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  const proceed = await ask('Sudah update DATABASE_URL? (y/n): ');
  
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled. Please update .env.local first.\n');
    console.log('📖 See QUICK_START.md for instructions.\n');
    rl.close();
    return;
  }
  
  console.log('\n📊 Step 1: Generating Prisma Client...\n');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('\n✅ Prisma Client generated!\n');
  } catch (error) {
    console.log('\n❌ Failed to generate Prisma Client\n');
    rl.close();
    return;
  }
  
  console.log('📊 Step 2: Pushing schema to Supabase...\n');
  console.log('⏳ This may take a minute...\n');
  
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('\n✅ Database schema synced!\n');
  } catch (error) {
    console.log('\n❌ Failed to push schema\n');
    console.log('💡 Possible reasons:');
    console.log('   - DATABASE_URL incorrect');
    console.log('   - Password wrong or not URL-encoded');
    console.log('   - Network connection issue\n');
    rl.close();
    return;
  }
  
  console.log('================================\n');
  console.log('🎉 Database setup complete!\n');
  console.log('📝 Next steps:\n');
  console.log('1. Create storage bucket in Supabase Dashboard');
  console.log('   https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/storage/buckets\n');
  console.log('2. Run test to verify:');
  console.log('   node scripts/test-supabase-connection.js\n');
  console.log('3. Start dev server:');
  console.log('   npm run dev\n');
  
  rl.close();
}

main();
