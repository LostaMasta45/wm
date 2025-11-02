/**
 * Script untuk test koneksi Supabase
 * Run: node scripts/test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_BUCKET;

console.log('🔍 Testing Supabase Connection...\n');
console.log('================================');

// Test 1: Check Environment Variables
console.log('\n📋 Step 1: Checking Environment Variables');
console.log('------------------------------------------');

const checks = {
  'NEXT_PUBLIC_SUPABASE_URL': !!supabaseUrl,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!supabaseAnonKey,
  'SUPABASE_SERVICE_ROLE_KEY': !!supabaseServiceKey,
  'SUPABASE_BUCKET': !!bucketName,
};

let allEnvVarsPresent = true;
for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  console.log(`${status} ${key}: ${value ? 'Set' : 'Missing'}`);
  if (!value) allEnvVarsPresent = false;
}

if (!allEnvVarsPresent) {
  console.log('\n❌ ERROR: Some environment variables are missing!');
  console.log('Please check your .env.local file.');
  process.exit(1);
}

console.log('\n✅ All environment variables are set!');

// Test 2: Test Supabase Client Connection
console.log('\n🔌 Step 2: Testing Supabase Client Connection');
console.log('----------------------------------------------');

async function testClientConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test ping by checking if we can connect
    const { data, error } = await supabase.from('brands').select('id').limit(1);
    
    // If error is "table not found", connection is OK, just no tables yet
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      throw error;
    }
    
    console.log('✅ Client connection successful!');
    console.log(`   URL: ${supabaseUrl}`);
    return true;
  } catch (error) {
    console.log('❌ Client connection failed!');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Test Admin Client Connection
console.log('\n🔑 Step 3: Testing Admin Client Connection');
console.log('-------------------------------------------');

async function testAdminConnection() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    const { data, error } = await supabaseAdmin.from('brands').select('id').limit(1);
    
    // If error is "table not found", connection is OK, just no tables yet
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      throw error;
    }
    
    console.log('✅ Admin connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Admin connection failed!');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Check Storage Bucket
console.log('\n📦 Step 4: Checking Storage Bucket');
console.log('-----------------------------------');

async function testStorageBucket() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    console.log(`📁 Available buckets: ${buckets.map(b => b.name).join(', ')}`);
    
    const bucketExists = buckets.some(b => b.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' exists!`);
      
      // Check bucket settings
      const bucket = buckets.find(b => b.name === bucketName);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   File size limit: ${bucket.file_size_limit ? bucket.file_size_limit + ' bytes' : 'Not set'}`);
      
      return true;
    } else {
      console.log(`❌ Bucket '${bucketName}' not found!`);
      console.log('   Please create the bucket in Supabase Dashboard → Storage');
      return false;
    }
  } catch (error) {
    console.log('❌ Storage check failed!');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 5: Test Database Tables
console.log('\n🗄️  Step 5: Checking Database Tables');
console.log('------------------------------------');

async function testDatabaseTables() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Expected tables
    const expectedTables = ['brands', 'assets', 'presets', 'posters', 'compositions', 'outputs', 'audit_logs', 'projects'];
    const foundTables = [];
    const missingTables = [];
    
    for (const table of expectedTables) {
      const { data, error } = await supabaseAdmin.from(table).select('id').limit(1);
      
      // No error or table exists = found
      if (!error || error.message.includes('relation') === false) {
        foundTables.push(table);
      } else {
        missingTables.push(table);
      }
    }
    
    if (foundTables.length > 0) {
      console.log(`✅ Found ${foundTables.length} tables: ${foundTables.join(', ')}`);
    }
    
    if (missingTables.length > 0) {
      console.log(`⚠️  Missing ${missingTables.length} tables: ${missingTables.join(', ')}`);
      console.log('   Run: npm run prisma:push');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Could not check tables (this is OK if schema not pushed yet)');
    console.log(`   Error: ${error.message}`);
    console.log('   Run: npm run prisma:push');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n');
  
  const clientOk = await testClientConnection();
  const adminOk = await testAdminConnection();
  const storageOk = await testStorageBucket();
  const tablesOk = await testDatabaseTables();
  
  console.log('\n================================');
  console.log('📊 Summary');
  console.log('================================\n');
  
  const results = {
    'Environment Variables': allEnvVarsPresent,
    'Client Connection': clientOk,
    'Admin Connection': adminOk,
    'Storage Bucket': storageOk,
    'Database Tables': tablesOk,
  };
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  console.log('\n================================\n');
  
  const allPassed = Object.values(results).every(v => v);
  
  if (allPassed) {
    console.log('🎉 All tests passed! Supabase is ready to use.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    console.log('📖 For detailed setup guide, see: SUPABASE_SETUP.md\n');
  }
  
  // Provide next steps
  console.log('📝 Next Steps:');
  console.log('================================');
  
  if (!tablesOk) {
    console.log('1. Create database tables:');
    console.log('   - Open: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor');
    console.log('   - Copy scripts/create-tables.sql');
    console.log('   - Paste and Run in SQL Editor\n');
  }
  
  if (!storageOk) {
    console.log('2. Create storage bucket:');
    console.log('   - Go to Supabase Dashboard → Storage');
    console.log('   - Create bucket named "posters"');
    console.log('   - Make it public\n');
  }
  
  if (allPassed) {
    console.log('1. Start development server:');
    console.log('   npm run dev\n');
    console.log('2. Test API endpoints:');
    console.log('   curl http://localhost:3000/api/brands\n');
  }
}

// Run tests
runAllTests().catch(console.error);
