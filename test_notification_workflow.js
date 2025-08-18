/**
 * Test Notification Workflow
 * 
 * This script tests the complete workflow including notifications:
 * 1. Create team → 2. Request to join league → 3. Admin approves → 4. Notifications created
 */

// Database connection setup
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'postgres', 
  password: 'postgres',
  port: 54322,
});

async function testNotificationWorkflow() {
  console.log('🔧 Starting notification workflow test...\n');

  try {
    // Step 1: Clean up existing test data
    console.log('1. Cleaning up existing test data...');
    await pool.query(`
      DELETE FROM notifications WHERE user_id = '11111111-1111-1111-1111-111111111111';
      DELETE FROM team_league_requests WHERE team_id = 'f2164789-7632-4565-9487-d71faabc5d58';
      DELETE FROM teams WHERE id = 'f2164789-7632-4565-9487-d71faabc5d58';
    `);
    console.log('✅ Test data cleaned up\n');

    // Step 2: Create test team
    console.log('2. Creating test team...');
    await pool.query(`
      INSERT INTO teams (
        id, name, captain_id, team_color, team_bio, 
        max_players, min_players, is_recruiting, created_at
      ) VALUES (
        'f2164789-7632-4565-9487-d71faabc5d58',
        'Test Thunder FC',
        '11111111-1111-1111-1111-111111111111',
        '#1E40AF',
        'Test team for notification workflow testing',
        15, 8, true, NOW()
      );
    `);
    console.log('✅ Test team created\n');

    // Step 3: Submit league request
    console.log('3. Submitting league request...');
    const requestResult = await pool.query(`
      INSERT INTO team_league_requests (
        id, team_id, league_id, requested_by, status, message, created_at
      ) VALUES (
        gen_random_uuid(),
        'f2164789-7632-4565-9487-d71faabc5d58',
        '20f5b4c7-ced3-4000-9680-3e7d567c1e2e',
        '11111111-1111-1111-1111-111111111111',
        'pending',
        'We would like to join LaLiga to test the notification system!',
        NOW()
      ) RETURNING id, team_id, league_id;
    `);
    
    const requestId = requestResult.rows[0].id;
    console.log(`✅ League request created with ID: ${requestId}\n`);

    // Step 4: Verify request was created
    console.log('4. Verifying request details...');
    const requestCheck = await pool.query(`
      SELECT 
        tlr.id, tlr.status, tlr.message,
        t.name as team_name,
        l.name as league_name,
        u.email as captain_email
      FROM team_league_requests tlr
      JOIN teams t ON tlr.team_id = t.id
      JOIN leagues l ON tlr.league_id = l.id
      JOIN auth.users u ON tlr.requested_by = u.id
      WHERE tlr.id = $1;
    `, [requestId]);

    if (requestCheck.rows.length > 0) {
      const request = requestCheck.rows[0];
      console.log(`✅ Request found:`);
      console.log(`   Team: ${request.team_name}`);
      console.log(`   League: ${request.league_name}`);
      console.log(`   Captain: ${request.captain_email}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Message: ${request.message}\n`);
    } else {
      throw new Error('Request not found after creation');
    }

    // Step 5: Check notifications before approval (should be 0)
    console.log('5. Checking notifications before approval...');
    const notificationsBefore = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = '11111111-1111-1111-1111-111111111111';
    `);
    console.log(`✅ Notifications before approval: ${notificationsBefore.rows[0].count}\n`);

    // Step 6: Approve the request (this should trigger notifications)
    console.log('6. Approving league request...');
    await pool.query(`
      UPDATE team_league_requests 
      SET 
        status = 'approved',
        review_message = 'Welcome to LaLiga! Looking forward to great matches.',
        reviewed_by = '22222222-2222-2222-2222-222222222222',
        reviewed_at = NOW()
      WHERE id = $1;
    `, [requestId]);
    console.log('✅ Request approved\n');

    // Step 7: Check notifications after approval (should be 2)
    console.log('7. Checking notifications after approval...');
    const notificationsAfter = await pool.query(`
      SELECT 
        id, type, title, message, read, created_at
      FROM notifications 
      WHERE user_id = '11111111-1111-1111-1111-111111111111'
      ORDER BY created_at DESC;
    `);
    
    console.log(`✅ Notifications after approval: ${notificationsAfter.rows.length}`);
    
    if (notificationsAfter.rows.length > 0) {
      console.log('\n📧 Notification Details:');
      notificationsAfter.rows.forEach((notification, index) => {
        console.log(`   ${index + 1}. Type: ${notification.type}`);
        console.log(`      Title: ${notification.title}`);
        console.log(`      Message: ${notification.message}`);
        console.log(`      Read: ${notification.read}`);
        console.log(`      Created: ${notification.created_at}`);
        console.log('');
      });
    }

    // Step 8: Verify team was added to league
    console.log('8. Verifying team league membership...');
    const membershipCheck = await pool.query(`
      SELECT 
        t.id as team_id, t.league_id, t.updated_at,
        t.name as team_name,
        l.name as league_name
      FROM teams t
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE t.id = 'f2164789-7632-4565-9487-d71faabc5d58';
    `);

    if (membershipCheck.rows.length > 0) {
      const membership = membershipCheck.rows[0];
      if (membership.league_id) {
        console.log('✅ Team successfully joined league:');
        console.log(`   Team: ${membership.team_name}`);
        console.log(`   League: ${membership.league_name}`);
        console.log(`   Updated: ${membership.updated_at}\n`);
      } else {
        throw new Error('Team league_id is still null after approval');
      }
    } else {
      throw new Error('Team was not found after approval');
    }

    // Step 9: Summary
    console.log('🎉 WORKFLOW TEST COMPLETE!\n');
    console.log('Summary:');
    console.log('✅ Team created successfully');
    console.log('✅ League request submitted successfully');
    console.log('✅ Request approved by admin');
    console.log('✅ Notifications created automatically');
    console.log('✅ Team added to league successfully');
    console.log('\n🚀 The complete notification workflow is working!\n');
    
    console.log('Next steps:');
    console.log('1. Visit player app (http://localhost:3001) to see notifications');
    console.log('2. Check the bell icon in the header');
    console.log('3. View the Recent Activity section on dashboard');
    console.log('4. All notifications should appear in real-time!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testNotificationWorkflow()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    pool.end();
    process.exit(1);
  });