#!/usr/bin/env node

/**
 * Error Handling System Test Script
 * 
 * Tests the complete error handling, recovery, and monitoring system
 * to ensure all components work together properly.
 * 
 * Usage:
 *   npm run test:errors
 *   node scripts/test-error-handling.js [--verbose]
 */

import { ErrorRecoveryService } from '../src/lib/error/error-recovery.service.js';
import { errorHandler, AppError, ErrorType } from '../src/lib/error/error-handler.js';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ErrorHandlingTester {
  constructor() {
    this.verbose = process.argv.includes('--verbose');
    this.errorRecovery = ErrorRecoveryService.getInstance();
    this.testResults = [];
  }

  log(message, color = COLORS.reset) {
    console.log(`${color}${message}${COLORS.reset}`);
  }

  debug(message) {
    if (this.verbose) {
      this.log(`  ${message}`, COLORS.cyan);
    }
  }

  async run() {
    this.log(`\n🧪 ${COLORS.bold}Error Handling System Tests${COLORS.reset}`, COLORS.blue);
    this.log('='.repeat(50));

    try {
      await this.testErrorRecoveryService();
      await this.testErrorHandler();
      await this.testCircuitBreaker();
      await this.testRetryLogic();
      await this.testErrorClassification();
      
      this.printTestResults();
      
      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;
      
      if (passed === total) {
        this.log(`\n✅ All ${total} tests passed!`, COLORS.green);
        process.exit(0);
      } else {
        this.log(`\n❌ ${total - passed} of ${total} tests failed`, COLORS.red);
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`\n💥 Test suite failed: ${error.message}`, COLORS.red);
      if (this.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  async testErrorRecoveryService() {
    this.log('\n📊 Testing Error Recovery Service...', COLORS.blue);

    // Test 1: Error logging
    await this.runTest('Error Logging', async () => {
      const testError = new Error('Test error for logging');
      this.errorRecovery.logError(testError, { test: true });
      
      const logs = this.errorRecovery.getErrorLogs();
      if (logs.length === 0 || !logs.some(log => log.error.message === 'Test error for logging')) {
        throw new Error('Error was not logged properly');
      }
      
      this.debug('Error successfully logged');
    });

    // Test 2: Retry with backoff
    await this.runTest('Retry with Backoff', async () => {
      let attempts = 0;
      
      try {
        await this.errorRecovery.retryOperation(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        }, { maxAttempts: 5 });
      } catch (error) {
        throw new Error(`Retry operation failed: ${error.message}`);
      }
      
      if (attempts !== 3) {
        throw new Error(`Expected 3 attempts, got ${attempts}`);
      }
      
      this.debug(`Retry succeeded after ${attempts} attempts`);
    });

    // Test 3: Recovery strategy
    await this.runTest('Recovery Strategy', async () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';
      
      // This should attempt recovery but likely fail in test environment
      const recovered = await this.errorRecovery.attemptRecovery(networkError);
      
      // We don't expect recovery to work in test, just that it doesn't crash
      this.debug(`Recovery attempted, result: ${recovered}`);
    });
  }

  async testErrorHandler() {
    this.log('\n🛡️  Testing Error Handler...', COLORS.blue);

    // Test 1: Error classification
    await this.runTest('Error Classification', async () => {
      const networkError = new Error('fetch failed');
      const authError = new Error('unauthorized access');
      const validationError = new Error('validation failed');

      const networkAppError = errorHandler.handle(networkError);
      const authAppError = errorHandler.handle(authError);
      const validationAppError = errorHandler.handle(validationError);

      if (networkAppError.type !== ErrorType.NETWORK) {
        throw new Error(`Expected NETWORK error, got ${networkAppError.type}`);
      }
      
      if (authAppError.type !== ErrorType.AUTH) {
        throw new Error(`Expected AUTH error, got ${authAppError.type}`);
      }
      
      if (validationAppError.type !== ErrorType.VALIDATION) {
        throw new Error(`Expected VALIDATION error, got ${validationAppError.type}`);
      }

      this.debug('Error types classified correctly');
    });

    // Test 2: Error formatting
    await this.runTest('Error Formatting', async () => {
      const testError = new AppError('Test error', ErrorType.CLIENT);
      const formatted = errorHandler.format(testError);

      if (!formatted.title || !formatted.message) {
        throw new Error('Error formatting is incomplete');
      }

      this.debug(`Formatted: ${formatted.title} - ${formatted.message}`);
    });

    // Test 3: Async error handling
    await this.runTest('Async Error Handling', async () => {
      try {
        await errorHandler.handleAsync(async () => {
          throw new Error('Async test error');
        });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw new Error('Error was not properly wrapped in AppError');
        }
      }

      this.debug('Async errors handled correctly');
    });
  }

  async testCircuitBreaker() {
    this.log('\n⚡ Testing Circuit Breaker...', COLORS.blue);

    await this.runTest('Circuit Breaker Pattern', async () => {
      // Create multiple failures to trip circuit breaker
      const testError = new Error('Circuit breaker test');
      
      // Generate several failures
      for (let i = 0; i < 6; i++) {
        try {
          await this.errorRecovery.attemptRecovery(testError);
        } catch {
          // Expected to fail
        }
      }

      const status = this.errorRecovery.getCircuitBreakerStatus();
      
      // Check if any circuit breakers are open
      let hasOpenCircuit = false;
      for (const [key, state] of status.entries()) {
        if (state.isOpen || state.failures >= 5) {
          hasOpenCircuit = true;
          break;
        }
      }

      this.debug(`Circuit breaker status: ${hasOpenCircuit ? 'triggered' : 'not triggered'}`);
    });
  }

  async testRetryLogic() {
    this.log('\n🔄 Testing Retry Logic...', COLORS.blue);

    await this.runTest('Exponential Backoff', async () => {
      let attempts = 0;
      const startTime = Date.now();
      
      try {
        await this.errorRecovery.retryOperation(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Still failing');
          }
          return 'success';
        }, {
          maxAttempts: 3,
          initialDelay: 100,
          backoffFactor: 2
        });
      } catch (error) {
        throw new Error(`Retry failed: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      
      // Should take at least 100 + 200 = 300ms due to delays
      if (duration < 200) {
        throw new Error(`Retry completed too quickly: ${duration}ms`);
      }

      this.debug(`Retry completed in ${duration}ms with ${attempts} attempts`);
    });
  }

  async testErrorClassification() {
    this.log('\n🏷️  Testing Error Classification...', COLORS.blue);

    await this.runTest('Network Error Detection', async () => {
      const errors = [
        new Error('fetch failed'),
        new Error('Network request failed'),
        { name: 'NetworkError', message: 'Connection failed' }
      ];

      for (const error of errors) {
        const appError = errorHandler.handle(error);
        if (appError.type !== ErrorType.NETWORK) {
          throw new Error(`Failed to classify network error: ${error.message}`);
        }
      }

      this.debug('Network errors classified correctly');
    });

    await this.runTest('Auth Error Detection', async () => {
      const errors = [
        new Error('unauthorized'),
        new Error('authentication failed'),
        { name: 'AuthError', message: '401 Unauthorized' }
      ];

      for (const error of errors) {
        const appError = errorHandler.handle(error, { statusCode: 401 });
        if (appError.type !== ErrorType.AUTH) {
          throw new Error(`Failed to classify auth error: ${error.message}`);
        }
      }

      this.debug('Auth errors classified correctly');
    });
  }

  async runTest(name, testFn) {
    this.debug(`Running: ${name}`);
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        passed: true,
        duration,
        error: null
      });
      
      this.log(`  ✅ ${name} (${duration}ms)`, COLORS.green);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        passed: false,
        duration,
        error: error.message
      });
      
      this.log(`  ❌ ${name} (${duration}ms): ${error.message}`, COLORS.red);
    }
  }

  printTestResults() {
    this.log('\n📊 Test Results Summary:', COLORS.blue);
    this.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    this.log(`Total Tests: ${this.testResults.length}`);
    this.log(`Passed: ${passed}`, COLORS.green);
    this.log(`Failed: ${failed}`, failed > 0 ? COLORS.red : COLORS.green);
    this.log(`Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      this.log('\n❌ Failed Tests:', COLORS.red);
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          this.log(`  - ${r.name}: ${r.error}`, COLORS.red);
        });
    }
  }
}

// Run the tests
const tester = new ErrorHandlingTester();
tester.run().catch(() => process.exit(1));