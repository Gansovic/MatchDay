#!/usr/bin/env node

/**
 * Create database tables using Supabase REST API
 * Since direct SQL execution isn't available, we'll check if tables exist
 * and guide the user to manually create them via dashboard
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...');
  console.log(`📡 Target: ${SUPABASE_URL}`);
  
  try {
    // Check if we can access the API
    const apiResponse = await makeRequest('GET', '/rest/v1/');
    
    if (!apiResponse.success) {
      console.error('❌ Cannot connect to Supabase API');
      console.error('Response:', apiResponse.data);
      return;
    }
    
    console.log('✅ Supabase API connection successful');
    
    // Parse the OpenAPI spec to see available tables
    const apiSpec = JSON.parse(apiResponse.data);
    const availablePaths = Object.keys(apiSpec.paths || {});
    
    console.log(`📊 Available API paths: ${availablePaths.length}`);
    
    if (availablePaths.length <= 1) {
      console.log('⚠️  No database tables detected - database appears empty');
      console.log('\n📋 Required tables for MatchDay:');
      console.log('  - users (user profiles)');
      console.log('  - leagues (competition leagues)');
      console.log('  - teams (football teams)');
      console.log('  - team_members (player roster)');
      console.log('  - team_invitations (invitation system) ⭐ CRITICAL');
      console.log('  - matches (game scheduling)');
      console.log('  - league_standings (league tables)');
      console.log('  - player_leaderboard (statistics)');
      
      console.log('\n💡 Since direct SQL execution via API is not available, you have two options:');
      console.log('1. Access your Supabase dashboard at: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe');
      console.log('2. Go to SQL Editor and paste the complete schema I provided');
      console.log('3. Click RUN to execute');
      
      console.log('\n📄 The complete schema is in: complete-supabase-schema.sql');
      
      return;
    }
    
    // Check for specific tables if any exist
    const tables = availablePaths
      .filter(path => path !== '/')
      .map(path => path.substring(1)); // Remove leading slash
      
    console.log('✅ Found existing tables:', tables);
    
    // Check for critical tables
    const criticalTables = ['users', 'teams', 'team_invitations'];
    const missingCritical = criticalTables.filter(table => !tables.includes(table));
    
    if (missingCritical.length > 0) {
      console.log('❌ Missing critical tables:', missingCritical);
      console.log('🔧 The team invitation system will not work without these tables');
    } else {
      console.log('✅ All critical tables appear to be present');
    }
    
  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
  }
}

async function testTableAccess() {
  console.log('\n🧪 Testing table access...');
  
  const testTables = ['users', 'teams', 'team_invitations', 'leagues'];
  
  for (const table of testTables) {
    try {
      const response = await makeRequest('GET', `/rest/v1/${table}?limit=0`);
      
      if (response.success) {
        console.log(`✅ ${table} - accessible`);
      } else {
        console.log(`❌ ${table} - not found or inaccessible`);
      }
    } catch (error) {
      console.log(`❌ ${table} - error: ${error.message}`);
    }
  }
}

if (require.main === module) {
  checkDatabaseStatus().then(() => {
    return testTableAccess();
  }).catch(console.error);
}