#!/usr/bin/env node

/**
 * Simple Admin User Creation
 * Creates both Supabase Auth user and database user entry
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Using Supabase URL:', supabaseUrl);
console.log('🔑 Service key configured:', serviceRoleKey ? 'Yes' : 'No');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const email = 'admin@standardized.test';
const password = 'admin123!';

// Create auth user via REST API
function createAuthUser() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    const url = new URL('/auth/v1/admin/users', supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Create user profile via REST API
function createUserProfile(userId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      id: userId,
      email,
      full_name: 'Admin User',
      role: 'app_admin'
    });

    const url = new URL('/rest/v1/users', supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Length': Buffer.byteLength(postData),
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Creating admin user...');

    console.log('📧 Creating auth user...');
    const authUser = await createAuthUser();
    console.log('✅ Auth user created:', authUser.id);

    console.log('📝 Creating user profile...');
    const profile = await createUserProfile(authUser.id);
    console.log('✅ Profile created successfully');

    console.log('');
    console.log('🎉 Admin user ready!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('🌐 Admin app: http://localhost:3001');

  } catch (error) {
    if (error.message.includes('User already registered')) {
      console.log('ℹ️ User already exists - login credentials:');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

main();