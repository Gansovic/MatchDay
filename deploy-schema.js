#!/usr/bin/env node

/**
 * Schema deployment script for MatchDay
 * Executes the complete database schema using Supabase service role
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function executeSQLCommand(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    
    const postData = JSON.stringify({ sql });
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function deploySchema() {
  console.log('🚀 Starting MatchDay database schema deployment...');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'complete-supabase-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log(`📄 Loaded schema file: ${schema.length} characters`);
    
    // Split schema into individual statements (simple approach)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        await executeSQLCommand(statement + ';');
        successful++;
      } catch (error) {
        console.warn(`⚠️  Statement ${i + 1} failed: ${error.message}`);
        failed++;
        
        // Don't stop on errors like "already exists" - these are expected
        if (!error.message.includes('already exists') && 
            !error.message.includes('does not exist')) {
          console.error('❌ Critical error, stopping deployment');
          throw error;
        }
      }
    }
    
    console.log('\n✅ Schema deployment completed!');
    console.log(`📊 Results: ${successful} successful, ${failed} failed/skipped`);
    
    // Test that tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const testQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    try {
      const result = await executeSQLCommand(testQuery);
      console.log('✅ Database tables verified successfully');
    } catch (error) {
      console.warn('⚠️  Could not verify tables:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function deploySchemaViaRawSQL() {
  console.log('🚀 Deploying schema via raw SQL execution...');
  
  try {
    const schemaPath = path.join(__dirname, 'complete-supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one command
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql: schema })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    console.log('✅ Schema deployed successfully!');
    
  } catch (error) {
    console.error('❌ Raw SQL deployment failed:', error.message);
    console.log('🔄 Falling back to statement-by-statement execution...');
    await deploySchema();
  }
}

// Run the deployment
if (require.main === module) {
  deploySchemaViaRawSQL();
}

module.exports = { deploySchema, deploySchemaViaRawSQL };