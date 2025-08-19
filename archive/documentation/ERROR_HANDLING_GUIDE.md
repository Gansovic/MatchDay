# MatchDay Error Handling System Guide

This guide explains the comprehensive error handling and automation system implemented to make MatchDay development more reliable and automatic.

## 🎯 Overview

The error handling system provides:

- **Automatic Error Recovery**: Intelligent retry logic with circuit breakers
- **Offline Mode Support**: Cached sessions and operation queuing
- **Development Automation**: One-command setup and reset
- **Real-time Monitoring**: Error dashboard with circuit breaker status
- **Centralized Error Management**: Consistent error handling across the app

## 🚀 Quick Start

### Automated Setup
```bash
# Initialize complete development environment
npm run dev:init

# Reset environment if things go wrong
npm run dev:reset

# Nuclear option - complete reset
npm run dev:reset:hard

# Start development with automatic setup
npm run dev:full
```

### Error Monitoring
```bash
# View error monitoring dashboard
npm run errors:monitor

# Test error handling system
npm run test:errors

# Test with detailed output
npm run test:errors-verbose
```

## 🏗️ Architecture

### Core Components

#### 1. **ErrorBoundary** (`/src/lib/error/error-boundary.tsx`)
React error boundary that catches and recovers from component errors.

```typescript
import { ErrorBoundary } from '@/lib/error/error-boundary';

// Wrap your components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or use the HOC
const SafeComponent = withErrorBoundary(YourComponent);
```

#### 2. **ErrorRecoveryService** (`/src/lib/error/error-recovery.service.ts`)
Centralized service for automatic error recovery with:
- Retry logic with exponential backoff
- Circuit breaker pattern
- Error logging and monitoring
- Recovery strategy pattern

```typescript
import { ErrorRecoveryService } from '@/lib/error/error-recovery.service';

const recovery = ErrorRecoveryService.getInstance();

// Retry an operation
await recovery.retryOperation(
  () => fetch('/api/data'),
  { maxAttempts: 3, initialDelay: 1000 }
);

// Attempt automatic recovery
const recovered = await recovery.attemptRecovery(error);
```

#### 3. **ErrorHandler** (`/src/lib/error/error-handler.ts`)
Unified error handling and formatting:

```typescript
import { errorHandler, handleError } from '@/lib/error/error-handler';

// Handle any error
const appError = handleError(error, {
  type: ErrorType.NETWORK,
  userId: 'user123'
});

// Async wrapper
const result = await errorHandler.handleAsync(async () => {
  return await riskyOperation();
});

// Function wrapper
const safeFunction = errorHandler.wrap(riskyFunction);
```

#### 4. **BaseService** (`/src/lib/services/base.service.ts`)
Base class for all services with built-in error handling:

```typescript
import { BaseService } from '@/lib/services/base.service';

export class MyService extends BaseService {
  async getData() {
    return this.executeOperation(
      () => fetch('/api/data').then(r => r.json()),
      { operationName: 'getData', userId: this.userId }
    );
  }

  async getCachedData() {
    return this.executeWithCache(
      'data-key',
      () => this.fetchData(),
      { operationName: 'getCachedData' }
    );
  }
}
```

## 🔐 Enhanced Authentication

The authentication service now includes:
- **Offline mode**: Cached sessions work without network
- **Automatic retry**: Failed auth operations retry automatically
- **Session recovery**: Automatic session refresh on errors
- **Health monitoring**: Real-time auth system status

```typescript
import { authService } from '@shared/lib/auth';

// Check offline status
if (authService.isOfflineMode()) {
  console.log('Operating in offline mode');
}

// Queue operations for when online
authService.queueForOnline(async () => {
  await updateProfile(data);
});

// Get auth status
const status = authService.getAuthStatus();
console.log(status.queuedOperations, 'operations queued');

// Force session refresh
await authService.refreshSession();
```

## 📊 Error Monitoring Dashboard

Visit `http://localhost:3000/dev/errors` to see:

- **Real-time error logs** with filtering and search
- **Error statistics** including recovery rates
- **Circuit breaker status** for different error types
- **Error type breakdown** with frequency counts
- **Test error generation** for testing the system

Features:
- Auto-refresh every 5 seconds
- Filter by recovered/unrecovered errors
- Search by error message or type
- Clear logs functionality
- Test error generation

## 🛠️ Development Automation

### Setup Script (`scripts/dev-init.js`)
Automatically handles:
- Dependency installation
- Supabase startup and health checks
- Database migration application
- Development user creation
- Authentication system validation
- Git hooks setup

Usage:
```bash
npm run dev:init              # Standard setup
npm run dev:init:force        # Force setup with verbose output
```

### Reset Script (`scripts/dev-reset.js`)
Handles environment reset:
- Stop all development servers
- Reset Supabase database
- Clear caches and temporary files
- Optional dependency reset
- Environment restart

Usage:
```bash
npm run dev:reset             # Soft reset, keep data
npm run dev:reset:hard        # Nuclear reset, lose all data
```

## 🔄 Error Recovery Strategies

### Built-in Recovery Strategies

1. **Network Errors**
   - Wait and retry with backoff
   - Check network connectivity
   - Queue operations for when online

2. **Authentication Errors**
   - Attempt session refresh
   - Clear corrupted tokens
   - Fallback to cached credentials

3. **Database Errors**
   - Retry with connection reset
   - Wait for database recovery
   - Cache data for offline access

4. **Generic Errors**
   - Clear problematic cache
   - Reset application state
   - Preserve critical data

### Custom Recovery Strategies

```typescript
import { ErrorRecoveryService } from '@/lib/error/error-recovery.service';

const recovery = ErrorRecoveryService.getInstance();

recovery.addRecoveryStrategy({
  canHandle: (error) => error.message.includes('custom-error'),
  recover: async (error) => {
    // Your custom recovery logic
    console.log('Attempting custom recovery...');
    return await customRecoveryLogic();
  },
  priority: 1 // Lower numbers = higher priority
});
```

## 📈 Error Types

The system classifies errors into types for better handling:

- **NETWORK**: Connection, fetch, and network-related errors
- **AUTH**: Authentication and authorization errors
- **VALIDATION**: Input validation and data format errors
- **DATABASE**: Database connection and query errors
- **PERMISSION**: Access control and permission errors
- **NOT_FOUND**: Resource not found errors
- **RATE_LIMIT**: API rate limiting errors
- **SERVER**: Server-side errors (5xx)
- **CLIENT**: Client-side errors (4xx)
- **UNKNOWN**: Unclassified errors

## 🧪 Testing

### Error Handling Tests
```bash
npm run test:errors           # Run error handling tests
npm run test:errors-verbose   # Detailed test output
```

Test categories:
- Error recovery service functionality
- Error classification and formatting
- Circuit breaker behavior
- Retry logic with exponential backoff
- Network error detection
- Auth error handling

### Manual Testing
```bash
# Test development setup
npm run dev:init

# Test environment reset
npm run dev:reset

# Test authentication system
npm run auth:test

# Monitor errors in real-time
npm run errors:monitor
```

## 🔧 Configuration

### Service Configuration
```typescript
// Base service options
const service = new MyService({
  retryAttempts: 3,      // Number of retry attempts
  retryDelay: 1000,      // Initial retry delay (ms)
  cacheEnabled: true,    // Enable caching
  cacheTTL: 300000,      // Cache TTL (5 minutes)
  timeout: 10000         // Operation timeout (10 seconds)
});
```

### Error Recovery Configuration
```typescript
const recovery = ErrorRecoveryService.getInstance();

// Circuit breaker settings are internal:
// - 5 failures trigger circuit breaker
// - 1 minute reset time
// - Exponential backoff with jitter
```

## 📝 Best Practices

### 1. Use Error Boundaries
Always wrap your components with error boundaries:
```typescript
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>
```

### 2. Extend BaseService
Create services that extend BaseService for automatic error handling:
```typescript
export class ApiService extends BaseService {
  // Automatic retry, caching, and error handling
}
```

### 3. Use Proper Error Context
Provide context when handling errors:
```typescript
const error = handleError(originalError, {
  type: ErrorType.NETWORK,
  userId: currentUser.id,
  metadata: { endpoint: '/api/users', method: 'GET' }
});
```

### 4. Monitor Error Dashboard
Regularly check the error dashboard in development to:
- Identify recurring issues
- Monitor recovery rates
- Test error scenarios

### 5. Test Error Scenarios
Use the test error button in the dashboard to:
- Verify error handling works
- Test recovery mechanisms
- Validate monitoring systems

## 🚨 Troubleshooting

### Common Issues

#### "Development setup failed"
```bash
# Check if Docker is running
docker --version

# Reset and try again
npm run dev:reset
npm run dev:init:force
```

#### "Authentication not working"
```bash
# Check auth system health
npm run auth:check

# Reset auth system
npm run auth:recover

# Create fresh dev users
npm run dev:create-users
```

#### "Errors not showing in dashboard"
1. Navigate to `http://localhost:3000/dev/errors`
2. Enable auto-refresh
3. Generate test errors
4. Check browser console for client-side errors

#### "Circuit breaker stuck open"
Circuit breakers reset automatically after 1 minute, or you can:
```javascript
// In browser console
ErrorRecoveryService.getInstance().clearErrorLogs();
```

### Debug Commands

```bash
# Verbose setup with debug output
npm run dev:init:force

# Verbose error testing
npm run test:errors-verbose

# Verbose auth testing
npm run auth:test-verbose

# Check all system status
npm run auth:check && npm run test:errors
```

## 📖 Additional Resources

- **Error Boundary Documentation**: React error boundary patterns
- **Circuit Breaker Pattern**: Resilience engineering principles
- **Retry Strategies**: Exponential backoff best practices
- **Offline-First Design**: Progressive enhancement techniques

## 🤝 Contributing

When adding new features:

1. **Extend BaseService** for new service classes
2. **Add error recovery strategies** for new error types
3. **Test with error scenarios** using the dashboard
4. **Update error classification** in ErrorHandler if needed
5. **Add tests** to the test suite

Example contribution:
```typescript
// 1. Create service extending BaseService
export class NewFeatureService extends BaseService {
  async newOperation() {
    return this.executeOperation(
      () => this.performOperation(),
      { operationName: 'newOperation' }
    );
  }
}

// 2. Add recovery strategy if needed
recovery.addRecoveryStrategy({
  canHandle: (error) => error.code === 'NEW_ERROR_TYPE',
  recover: async () => { /* recovery logic */ },
  priority: 2
});

// 3. Add tests
await runTest('New Feature Error Handling', async () => {
  // Test your error scenarios
});
```

---

## 🎉 Summary

The MatchDay error handling system transforms error management from reactive debugging into proactive reliability engineering. With automatic recovery, offline support, and comprehensive monitoring, developers can focus on building features while the system handles the complexity of error management.

**Key Benefits:**
- ✅ **Reduced Development Friction**: One-command setup and reset
- ✅ **Automatic Error Recovery**: Intelligent retry and fallback strategies  
- ✅ **Offline Resilience**: Cached sessions and operation queuing
- ✅ **Real-time Monitoring**: Error dashboard with actionable insights
- ✅ **Centralized Management**: Consistent error handling patterns
- ✅ **Developer Experience**: Clear error messages and recovery suggestions

This system ensures that both development and production environments remain stable and recoverable, making MatchDay a more reliable platform for everyone.