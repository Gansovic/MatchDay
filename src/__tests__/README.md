# MatchDay Testing Suite

This directory contains comprehensive integration tests for the MatchDay application, focusing on API endpoints and database interactions.

## Test Structure

### 📁 API Tests
- **`/api/teams/__tests__/`** - Teams API integration tests
- **`/api/leagues/__tests__/`** - Leagues API integration tests  
- **`/api/profile/__tests__/`** - Profile API integration tests

### 📁 Database Tests
- **`/lib/test-utils/__tests__/`** - Database integrity and constraint tests

### 📁 Error Handling Tests
- **`/src/__tests__/error-handling.integration.test.ts`** - Comprehensive error scenario tests

## Test Categories

### 🔧 Integration Tests
These tests verify that API endpoints properly interact with the actual database:

1. **Team Creation & Management**
   - POST /api/teams - Team creation with database verification
   - GET /api/teams - Team retrieval with relationship data
   - Captain assignment and team member creation
   - Team independence from leagues

2. **League Operations**
   - GET /api/leagues - League retrieval and data structure validation
   - Mock data consistency and format verification

3. **User Profile Management**
   - GET /api/profile - Profile retrieval with auth verification
   - PUT /api/profile - Full profile updates
   - PATCH /api/profile - Partial profile updates
   - Auth.users to public.user_profiles synchronization

4. **Database Integrity**
   - Foreign key constraints enforcement
   - Team independence feature validation
   - Captain and team member relationships
   - Data consistency and constraint enforcement

5. **Error Handling**
   - Malformed request handling
   - Authentication errors
   - Validation failures
   - Business logic errors
   - Security validation (XSS, SQL injection prevention)

## Running Tests

### Prerequisites
1. **Supabase Local Instance**: Tests require a local Supabase instance running on `http://127.0.0.1:54321`
2. **Environment Setup**: Copy `.env.test` configuration
3. **Database Schema**: Ensure all migrations are applied

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm test -- --testNamePattern="integration"

# Run specific test file
npm test teams.integration.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests for specific API
npm test src/app/api/teams/__tests__/
npm test src/app/api/profile/__tests__/
npm test src/app/api/leagues/__tests__/
```

### Test Environment Configuration

Tests use the `.env.test` file with these key settings:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=test
```

## Test Features

### 🛠 Test Utilities

**Database Test Utils** (`/lib/test-utils/database-test-utils.ts`):
- `createTestClient()` - Create Supabase client with service role
- `createTestUser()` - Create test users with profiles
- `createTestLeague()` - Create test leagues
- `createTestTeam()` - Create test teams
- `cleanupTestData()` - Clean up test data after tests
- `verifyTeamExists()` - Verify team creation in database
- `verifyTeamMemberExists()` - Verify team membership

**Test Helpers** (`/src/__tests__/test-helpers.ts`):
- Custom Jest matchers (`toBeValidUUID`, `toBeOneOf`, etc.)
- Test data factories
- Mock request creators
- Performance measurement utilities
- Validation helpers

### 🔍 What Tests Verify

#### Database State Verification
- Teams are actually created in the database
- Captain is properly assigned and exists as team member
- Foreign key relationships work correctly
- Team independence (teams persist when leagues are deleted)
- Constraint enforcement (unique names, valid references)

#### API Response Validation
- Correct HTTP status codes
- Proper response structure
- Error message formatting
- Validation error details

#### Security Testing
- Authentication requirement enforcement
- Authorization token validation
- XSS prevention
- SQL injection prevention
- Input sanitization

#### Business Logic Testing
- Team name uniqueness within leagues
- Captain must be team member
- Profile synchronization between auth and public tables
- Age restrictions and validation rules

## Test Data Management

### Isolation Strategy
- Each test creates its own test data
- Cleanup happens after each test/suite
- No shared state between tests
- Random names prevent conflicts

### Database Cleanup
Tests automatically clean up:
- Team members (respecting foreign keys)
- Teams
- Leagues  
- User profiles
- Auth users (when possible)

### Data Generation
```typescript
// Generate unique test names
const teamName = generateTestName('Test Team');
const leagueName = generateTestName('Test League');

// Factory methods for consistent test data
const userData = TestDataFactory.user({
  email: 'custom@example.com'
});
```

## Performance Considerations

- Tests have 30-second timeout for database operations
- Parallel execution where possible
- Efficient cleanup to prevent test pollution
- Connection pooling through Supabase client

## Debugging Tests

### Common Issues

1. **Database Connection Failures**
   ```bash
   # Check Supabase is running
   curl http://127.0.0.1:54321/health
   ```

2. **Authentication Errors**
   - Verify service role key in `.env.test`
   - Check Supabase local configuration

3. **Foreign Key Violations**
   - Ensure proper cleanup order
   - Check test data creation sequence

### Debug Mode
```bash
# Run with verbose output
npm test -- --verbose

# Run single test for debugging
npm test -- --testNamePattern="should create a team"
```

## Contributing

When adding new tests:

1. **Follow the naming convention**: `*.integration.test.ts`
2. **Use the test utilities** for database operations
3. **Clean up test data** in `afterEach`/`afterAll`
4. **Verify actual database state**, not just API responses
5. **Test both success and error scenarios**
6. **Include edge cases** and boundary conditions

### Test Template

```typescript
describe('New Feature Integration Tests', () => {
  let supabase: SupabaseClient<Database>;
  let testUser: TestUser;
  let createdIds: string[] = [];

  beforeAll(async () => {
    supabase = createTestClient();
    testUser = await createTestUser(supabase, TestDataFactory.user());
  });

  afterAll(async () => {
    await cleanupTestData(supabase, { userIds: [testUser.id] });
  });

  afterEach(async () => {
    if (createdIds.length > 0) {
      await cleanupTestData(supabase, { teamIds: createdIds });
      createdIds = [];
    }
  });

  it('should verify database behavior', async () => {
    // Test implementation
    // Verify API response AND database state
  });
});
```

## Test Coverage Goals

- **API Endpoints**: 100% of critical paths
- **Database Operations**: All CRUD operations
- **Error Scenarios**: Common and edge case failures
- **Security**: Authentication, authorization, input validation
- **Business Logic**: Core application rules and constraints

The test suite ensures that the MatchDay application's API layer properly interacts with the database and maintains data integrity across all operations.