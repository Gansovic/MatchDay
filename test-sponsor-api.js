/**
 * Test script for the sponsor API
 *
 * This tests if the authentication issue is resolved
 */

const ADMIN_URL = 'http://localhost:3001';
const SEASON_ID = 'test-season-id'; // Replace with actual season ID

async function testSponsorAPI() {
  console.log('Testing Sponsor API...\n');

  try {
    // First test GET request
    console.log('1. Testing GET /api/seasons/[seasonId]/sponsors');
    const getResponse = await fetch(`${ADMIN_URL}/api/seasons/${SEASON_ID}/sponsors`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${getResponse.status}`);
    const getData = await getResponse.json();
    console.log('   Response:', JSON.stringify(getData, null, 2));

    // Test POST request
    console.log('\n2. Testing POST /api/seasons/[seasonId]/sponsors');
    const postResponse = await fetch(`${ADMIN_URL}/api/seasons/${SEASON_ID}/sponsors`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Sponsor',
        website_url: 'https://example.com',
        display_order: 0
      })
    });

    console.log(`   Status: ${postResponse.status}`);
    const postData = await postResponse.json();
    console.log('   Response:', JSON.stringify(postData, null, 2));

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`GET Request: ${getResponse.ok ? '✓ Success' : '✗ Failed'}`);
    console.log(`POST Request: ${postResponse.ok ? '✓ Success' : '✗ Failed'}`);

    if (!postResponse.ok && postResponse.status === 401) {
      console.log('\n⚠️  Authentication issue still present!');
      console.log('Make sure you are logged into the admin app at http://localhost:3001');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Note about usage
console.log('===================================');
console.log('Sponsor API Test Script');
console.log('===================================');
console.log('NOTE: Make sure you are logged into the admin app first!');
console.log('NOTE: Update SEASON_ID variable with an actual season ID');
console.log('===================================\n');

testSponsorAPI();