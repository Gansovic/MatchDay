# MatchDay Test Suite

This directory contains the organized test suite for the MatchDay application.

## Directory Structure

```
tests/
├── integration/           # Integration tests that test API endpoints with real database
│   ├── teams.integration.test.ts
│   ├── profile.integration.test.ts
│   ├── leagues.integration.test.ts
│   ├── database-integrity.integration.test.ts
│   └── error-handling.integration.test.ts
├── unit/                  # Unit tests for individual components and functions
│   └── basic.test.ts
├── utils/                 # Test utilities and helpers
│   ├── database-test-utils.ts
│   └── test-helpers.ts
├── scripts/               # Standalone test scripts for manual testing
│   ├── test_api_simple.js
│   ├── test_team_service.js
│   ├── test_team_creation_fixed.js
│   ├── test_with_existing_user.js
│   ├── test_team_creation.js
│   ├── test_authentication_fixed.js
│   ├── test_database_integration.js
│   └── test_trigger_fixed.js
└── README.md             # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests Only
```bash
npm test tests/integration
```

### Unit Tests Only
```bash
npm test tests/unit
```

### Specific Test File
```bash
npm test tests/integration/teams.integration.test.ts
```

## Test Environment

- **Database**: Uses actual Supabase PostgreSQL database for integration tests
- **Framework**: Jest with Next.js integration
- **Environment**: Node.js for server-side testing

## Import Paths

Tests use the following import aliases:
- `@/`: Maps to `./src/` for application code
- `@tests/`: Maps to `./tests/` for test utilities

## Test Types

### Integration Tests
- Test complete API endpoints with real database interactions
- Verify data persistence and retrieval
- Test authentication and authorization
- Validate error handling and edge cases

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Focus on logic and behavior verification

### Test Scripts
- Manual testing scripts for development and debugging
- Direct database interactions and API calls
- Useful for testing specific scenarios during development

## Database Test Utilities

The `tests/utils/database-test-utils.ts` file provides:
- Test user creation and cleanup
- Test data generators
- Database verification helpers
- Supabase client setup for tests

## Configuration

- `jest.config.js`: Main Jest configuration
- `tsconfig.test.json`: TypeScript configuration for tests
- `.env.test`: Test environment variables (if needed)