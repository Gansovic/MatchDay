// Simple test of the team creation API
async function testTeamAPI() {
  try {
    console.log('Testing team creation API...');
    
    // Test data for League1
    const testData = {
      name: 'Test Team League1',
      league: 'League1',
      description: 'A test team for League1',
      maxMembers: 22,
      color: '#FF5733'
    };
    
    // Make the API call
    const response = await fetch('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mock authorization header - this will help us see what error we get
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response Status:', response.status);
    
    const result = await response.json();
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    // Also test GET endpoint
    console.log('\n--- Testing GET /api/teams ---');
    const getResponse = await fetch('http://localhost:3000/api/teams', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    console.log('GET Response Status:', getResponse.status);
    const getResult = await getResponse.json();
    console.log('GET Response Body:', JSON.stringify(getResult, null, 2));
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testTeamAPI();