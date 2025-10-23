# MatchDay Testing Guide

## Overview

This project uses **Jest** as the testing framework with **React Testing Library** for component tests and **Supertest** for API integration tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   └── services/            # Service layer tests
├── integration/             # Integration tests
│   ├── teams.integration.test.ts
│   ├── leagues.integration.test.ts
│   └── ...
├── utils/                   # Test utilities
│   ├── database-test-utils.ts
│   └── test-helpers.ts
└── TESTING.md              # This file
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### Integration Tests Only
```bash
pnpm test:integration
```

### Watch Mode (auto-rerun on changes)
```bash
pnpm test:watch
```

### With Coverage Report
```bash
pnpm test:coverage
```

### View Coverage Dashboard
```bash
pnpm test:coverage:view
```

This will:
1. Run all tests
2. Generate coverage report
3. Open the HTML coverage dashboard in your browser

### CI Mode (for GitHub Actions)
```bash
pnpm test:ci
```

## Viewing Coverage Reports

After running `pnpm test:coverage`, you'll see:

1. **Terminal Output**: Summary of coverage percentages
2. **HTML Dashboard**: Open `coverage/lcov-report/index.html` in your browser

### Coverage Dashboard Features

- **File-by-file breakdown**: Click any file to see line-by-line coverage
- **Color coding**:
  - 🟢 Green: Well-covered code
  - 🟡 Yellow: Partially covered
  - 🔴 Red: Not covered
- **Coverage metrics**:
  - **Statements**: Individual code statements
  - **Branches**: If/else conditions
  - **Functions**: Function coverage
  - **Lines**: Line coverage

## Coverage Thresholds

Minimum coverage requirements:

- **Global**: 70% lines, 60% branches/functions
- **Services** (`packages/services/**`): 80% lines, 70% branches, 75% functions

Tests will fail if coverage drops below these thresholds.

## Writing Tests

### Component Tests

```typescript
// tests/unit/components/example.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyComponent } from '../../../apps/player/src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Service Tests

```typescript
// tests/unit/services/example.test.ts
import { MyService } from '../../../packages/services/src/my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = MyService.getInstance(mockClient);
  });

  it('should perform operation', async () => {
    const result = await service.doSomething();
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/api.integration.test.ts
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/endpoint/route';

describe('API Integration', () => {
  it('should create resource', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

## Best Practices

### 1. Test Naming
- Use descriptive test names: `should render logo when logoUrl is provided`
- Group related tests with `describe` blocks
- Follow pattern: `should [expected behavior] when [condition]`

### 2. Test Organization
- One test file per component/service
- Group tests by feature/functionality
- Keep tests close to what they test

### 3. Test Coverage
- Aim for high coverage, but prioritize critical paths
- Test edge cases and error conditions
- Don't sacrifice readability for 100% coverage

### 4. Mocking
- Mock external dependencies (Supabase, APIs)
- Use Jest mocks: `jest.fn()`, `jest.mock()`
- Clean up mocks: `jest.clearAllMocks()` in `beforeEach`

### 5. Assertions
- Use specific assertions: `toBeInTheDocument()` vs `toBeTruthy()`
- Test user-facing behavior, not implementation details
- Verify both happy path and error cases

## Common Testing Patterns

### Testing API Routes
```typescript
const request = new NextRequest(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const response = await POST(request);
const json = await response.json();

expect(response.status).toBe(200);
expect(json.data).toBeDefined();
```

### Testing React Components
```typescript
// Render component
render(<Component prop="value" />);

// Query elements
const button = screen.getByRole('button');
const text = screen.getByText('Hello');

// User interactions
fireEvent.click(button);
await userEvent.type(input, 'text');

// Assertions
expect(button).toBeEnabled();
expect(text).toHaveClass('active');
```

### Testing Async Operations
```typescript
it('should fetch data', async () => {
  const promise = service.fetchData();
  await expect(promise).resolves.toBeDefined();

  const result = await promise;
  expect(result.data).toEqual(expectedData);
});
```

## Debugging Tests

### Run Single Test File
```bash
pnpm test path/to/test.test.ts
```

### Run Single Test
```bash
pnpm test -t "test name"
```

### Debug in VS Code
Add breakpoints and use "Jest: Debug" configuration

### Verbose Output
```bash
pnpm test --verbose
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Manual workflow dispatch

CI configuration: `.github/workflows/test.yml`

## Troubleshooting

### Tests failing locally but passing in CI
- Check Node.js version matches CI
- Clear Jest cache: `pnpm test --clearCache`
- Verify environment variables

### Slow tests
- Use `jest.setTimeout(10000)` for long-running tests
- Mock external APIs to avoid network calls
- Run tests in parallel (default)

### Coverage not updating
- Delete `coverage/` directory
- Run `pnpm test:coverage` fresh

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions?

Check existing tests in `tests/` directory for examples, or ask the team!
