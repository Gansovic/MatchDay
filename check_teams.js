// Quick check to see if any teams were created
async function checkTeams() {
  try {
    console.log('Checking if teams were created...');
    
    const response = await fetch('http://localhost:3000/api/teams', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    console.log('Response Status:', response.status);
    
    if (response.status === 401) {
      console.log('Authentication required - this is expected');
      return;
    }
    
    const result = await response.json();
    console.log('Teams found:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTeams();