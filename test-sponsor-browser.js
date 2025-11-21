/**
 * Browser console test script for the sponsor API
 *
 * To use this script:
 * 1. Make sure you're logged into the admin app at http://localhost:3001
 * 2. Navigate to a season page where you want to test sponsors
 * 3. Open browser DevTools Console (F12)
 * 4. Copy and paste this script into the console
 * 5. Replace the SEASON_ID with the actual season ID from the URL
 */

// Replace this with the actual season ID from your URL
const SEASON_ID = 'YOUR_SEASON_ID_HERE';

async function testSponsorAPI() {
  console.log('Testing Sponsor API from Browser...\n');

  try {
    // Test GET request
    console.log('1. Testing GET /api/seasons/[seasonId]/sponsors');
    const getResponse = await fetch(`/api/seasons/${SEASON_ID}/sponsors`, {
      credentials: 'include'
    });

    console.log(`   Status: ${getResponse.status}`);
    const getData = await getResponse.json();
    console.log('   Response:', getData);

    // Test POST request
    console.log('\n2. Testing POST /api/seasons/[seasonId]/sponsors');
    const postResponse = await fetch(`/api/seasons/${SEASON_ID}/sponsors`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Sponsor ' + Date.now(),
        website_url: 'https://example.com',
        display_order: 0
      })
    });

    console.log(`   Status: ${postResponse.status}`);
    const postData = await postResponse.json();
    console.log('   Response:', postData);

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`GET Request: ${getResponse.ok ? '✓ Success' : '✗ Failed'}`);
    console.log(`POST Request: ${postResponse.ok ? '✓ Success' : '✗ Failed'}`);

    if (postResponse.ok) {
      console.log('\n✅ Authentication is working correctly!');
      console.log('The sponsor should now appear in the UI');
    } else if (postResponse.status === 401) {
      console.log('\n❌ Authentication issue detected!');
      console.log('Please make sure you are logged in');
    } else if (postResponse.status === 403) {
      console.log('\n⚠️  Permission issue!');
      console.log('You need to be the league creator to add sponsors');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Instructions
console.log('===================================');
console.log('Sponsor API Browser Test Script');
console.log('===================================');
console.log('IMPORTANT: Update SEASON_ID variable first!');
console.log('Current SEASON_ID:', SEASON_ID);
console.log('');
console.log('To run the test, call: testSponsorAPI()');
console.log('===================================');

// Auto-run if season ID is set
if (SEASON_ID !== 'YOUR_SEASON_ID_HERE') {
  testSponsorAPI();
} else {
  console.log('⚠️  Please update SEASON_ID first, then run: testSponsorAPI()');
}