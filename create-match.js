// Script to create a match between teams using the API

async function createMatch() {
  try {
    // First, get available teams from the discover API
    const discoverResponse = await fetch('http://localhost:3000/api/teams/discover', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!discoverResponse.ok) {
      console.log('Failed to get teams, trying without auth');
      
      // For now, let's use the team IDs we know exist
      // adminTeam: 425d8961-057e-49c3-a5a5-fade06e785cc
      // We need to find another team ID
      
      const matchData = {
        homeTeamId: '425d8961-057e-49c3-a5a5-fade06e785cc', // adminTeam
        awayTeamId: '39a9f0fb-517b-4f34-934e-9a280d206989', // playerTeam (if it exists)
        matchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        venue: 'Main Stadium',
        matchType: 'friendly'
      };

      console.log('Creating match with data:', matchData);

      const createResponse = await fetch('http://localhost:3000/api/matches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData)
      });

      const result = await createResponse.json();
      console.log('Match creation response:', result);
      
      if (createResponse.ok) {
        console.log('✅ Match created successfully!');
        console.log('Match ID:', result.data?.id);
      } else {
        console.log('❌ Failed to create match:', result.error);
      }
    } else {
      const teams = await discoverResponse.json();
      console.log('Available teams:', teams);
      
      if (teams.data && teams.data.length >= 2) {
        const matchData = {
          homeTeamId: teams.data[0].id,
          awayTeamId: teams.data[1].id,
          matchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Main Stadium',
          matchType: 'friendly'
        };

        console.log('Creating match between:', teams.data[0].name, 'vs', teams.data[1].name);

        const createResponse = await fetch('http://localhost:3000/api/matches/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(matchData)
        });

        const result = await createResponse.json();
        if (createResponse.ok) {
          console.log('✅ Match created successfully!');
          console.log('Match details:', result.data);
        } else {
          console.log('❌ Failed to create match:', result.error);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createMatch();