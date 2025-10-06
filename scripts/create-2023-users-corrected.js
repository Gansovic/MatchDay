#!/usr/bin/env node

/**
 * Create 2023 Season Users - Corrected Version
 * Generates 55 realistic users for the 2023 football season
 * Uses proper UUID generation and correct database schema
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Realistic first names from various countries
const firstNames = [
  'Marcus', 'Liam', 'James', 'Oliver', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Mason',
  'Michael', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo', 'Jack',
  'Owen', 'Theodore', 'Aiden', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Matthew', 'Luke',
  'Carlos', 'Diego', 'Luis', 'Miguel', 'Rafael', 'Santiago', 'Matías', 'Alejandro', 'Sebastián', 'Andrés',
  'João', 'Pedro', 'Gabriel', 'Bruno', 'André', 'Paulo', 'Rui', 'Tiago', 'Nuno', 'Ricardo',
  'Ahmed', 'Mohamed', 'Omar', 'Hassan', 'Ali', 'Youssef', 'Mahmoud', 'Adam', 'Ibrahim', 'Khalil'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Silva', 'Santos', 'Ferreira', 'Pereira', 'Lima', 'Oliveira', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho',
  'González', 'Rodríguez', 'Fernández', 'Díaz', 'Pérez', 'Sánchez', 'Gómez', 'Martín', 'Ruiz', 'Moreno',
  'Al-Hassan', 'Al-Ahmad', 'El-Sayed', 'Mansour', 'Farouk', 'Khalil', 'Nasser', 'Rashid', 'Salim', 'Zaki'
];

const positions = ['goalkeeper', 'defender', 'midfielder', 'forward'];

// Generate birth dates for ages 18-35 (realistic football age range)
const generateBirthDate = () => {
  const currentYear = 2023;
  const age = Math.floor(Math.random() * (35 - 18 + 1)) + 18; // Age 18-35
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid date issues
  return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Generate phone numbers
const generatePhone = () => {
  const areaCodes = ['555', '444', '333', '222', '111'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+1-${areaCode}-${number}`;
};

// Generate player bios
const generateBio = (firstName, position) => {
  const bios = [
    `${firstName} is a dedicated ${position} with excellent technical skills and strong work ethic.`,
    `Experienced ${position} known for leadership qualities and tactical awareness on the field.`,
    `Dynamic ${position} with pace and creativity, always looking to make an impact in games.`,
    `Reliable ${position} who brings consistency and professionalism to every match.`,
    `Versatile ${position} with good passing ability and strong defensive instincts.`,
    `Passionate ${position} who loves the beautiful game and plays with heart and determination.`,
    `Skilled ${position} with excellent ball control and the ability to read the game well.`,
    `Committed ${position} who trains hard and always gives 100% for the team.`,
  ];
  return bios[Math.floor(Math.random() * bios.length)];
};

// Weight distribution for positions (more realistic team composition)
const getRandomPosition = () => {
  const rand = Math.random();
  if (rand < 0.08) return 'goalkeeper';     // ~8% goalkeepers (4-5 per 55 users)
  if (rand < 0.38) return 'defender';       // ~30% defenders
  if (rand < 0.70) return 'midfielder';     // ~32% midfielders  
  return 'forward';                         // ~30% forwards
};

async function createUsers() {
  console.log('🚀 Creating 55 realistic users for 2023 season...\n');

  const users = [];
  const userProfiles = [];
  
  for (let i = 0; i < 55; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const position = getRandomPosition();
    const birthDate = generateBirthDate();
    const phone = generatePhone();
    const bio = generateBio(firstName, position);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@matchday2023.com`;
    const fullName = `${firstName} ${lastName}`;
    const userId = randomUUID();

    // Create auth user
    const authUser = {
      id: userId,
      instance_id: '00000000-0000-0000-0000-000000000000',
      aud: 'authenticated',
      role: 'authenticated', 
      email: email,
      encrypted_password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      raw_app_meta_data: JSON.stringify({"provider": "email", "providers": ["email"]}),
      raw_user_meta_data: JSON.stringify({"display_name": fullName, "full_name": fullName}),
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confirmation_token: '',
      recovery_token: '',
      email_change_token_new: '',
      email_change: ''
    };

    users.push(authUser);

    // Create user profile (using correct schema)
    const userProfile = {
      id: userId,
      full_name: fullName,
      display_name: fullName,
      phone: phone,
      date_of_birth: birthDate,
      preferred_position: position, // Using preferred_position instead of position
      role: 'player',
      bio: bio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
      preferences: {}
    };

    userProfiles.push(userProfile);

    if ((i + 1) % 10 === 0) {
      console.log(`📊 Generated ${i + 1} users...`);
    }
  }

  console.log('\n📝 Position distribution:');
  const positionCounts = userProfiles.reduce((acc, user) => {
    acc[user.preferred_position] = (acc[user.preferred_position] || 0) + 1;
    return acc;
  }, {});
  console.log(`   Goalkeepers: ${positionCounts.goalkeeper || 0}`);
  console.log(`   Defenders: ${positionCounts.defender || 0}`);
  console.log(`   Midfielders: ${positionCounts.midfielder || 0}`);
  console.log(`   Forwards: ${positionCounts.forward || 0}`);

  try {
    console.log('\n💾 Inserting auth users into database...');
    
    // Insert auth users in batches of 10
    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);
      
      for (const user of batch) {
        // Use raw SQL to insert into auth.users
        const { error } = await supabase
          .from('_supabase_admin')
          .select('*')
          .limit(1);

        if (error) {
          // Fallback: Use direct SQL insert
          const { error: sqlError } = await supabase.rpc('exec_sql', {
            sql: `
              INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
                is_super_admin, created_at, updated_at
              ) VALUES (
                '${user.id}', '${user.instance_id}', '${user.aud}', '${user.role}', '${user.email}',
                '${user.encrypted_password}', '${user.email_confirmed_at}', '${user.last_sign_in_at}',
                '${user.raw_app_meta_data}', '${user.raw_user_meta_data}', ${user.is_super_admin},
                '${user.created_at}', '${user.updated_at}'
              ) ON CONFLICT (id) DO NOTHING;
            `
          });

          if (sqlError && !sqlError.message?.includes('already exists')) {
            console.error(`❌ Error inserting auth user ${user.email}:`, sqlError);
          }
        }
      }
      
      console.log(`✅ Inserted auth users batch ${Math.ceil((i + 10) / 10)}`);
    }

    console.log('\n💾 Inserting user profiles...');
    
    // Insert user profiles in batches of 10
    for (let i = 0; i < userProfiles.length; i += 10) {
      const batch = userProfiles.slice(i, i + 10);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(batch)
        .select('full_name, preferred_position');

      if (error) {
        console.error(`❌ Error inserting user profiles batch ${Math.ceil((i + 10) / 10)}:`, error);
      } else {
        console.log(`✅ Inserted user profiles batch ${Math.ceil((i + 10) / 10)}`);
      }
    }

    console.log(`\n🎉 Created ${users.length} realistic users for 2023 season!`);
    
    // Display some sample users
    console.log('\n👥 Sample users created:');
    userProfiles.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} - ${user.preferred_position} (${users[index].email})`);
    });
    
    console.log(`\n📧 All users have emails like: ${users[0].email}`);
    console.log('🔐 All users have password: "password" for testing purposes.\n');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  }
}

// Run the script
if (require.main === module) {
  createUsers();
}

module.exports = { createUsers };