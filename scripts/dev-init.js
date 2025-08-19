#!/usr/bin/env node

/**
 * MatchDay Development Initialization Script
 * 
 * Automated setup script that ensures the development environment is properly
 * configured and ready to work. Handles common setup tasks and error recovery.
 * 
 * Usage:
 *   npm run dev:init
 *   node scripts/dev-init.js [--force] [--verbose]
 */

import { createClient } from '@supabase/supabase-js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DevInitializer {
  constructor() {
    this.verbose = process.argv.includes('--verbose');
    this.force = process.argv.includes('--force');
    this.supabase = null;
    this.results = {
      supabase: null,
      migrations: null,
      users: null,
      health: null,
      dependencies: null
    };
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
    this.log(`\n🚀 ${COLORS.bold}MatchDay Development Environment Setup${COLORS.reset}`, COLORS.blue);
    this.log('='.repeat(50));

    try {
      await this.checkDependencies();
      await this.setupSupabase();
      await this.applyMigrations();
      await this.createDevelopmentUsers();
      await this.validateAuthSystem();
      await this.setupGitHooks();
      
      this.printSummary();
      this.log('\n✅ Development environment ready!', COLORS.green);
      
    } catch (error) {
      this.log(`\n❌ Setup failed: ${error.message}`, COLORS.red);
      
      if (this.verbose) {
        console.error(error);
      }
      
      this.printTroubleshootingTips();
      process.exit(1);
    }
  }

  async checkDependencies() {
    this.log('\n📦 Checking dependencies...', COLORS.blue);

    try {
      // Check if package.json exists and install if needed
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageExists = await fs.access(packagePath).then(() => true).catch(() => false);
      
      if (!packageExists) {
        throw new Error('package.json not found. Are you in the right directory?');
      }

      // Check if node_modules exists
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      const nodeModulesExists = await fs.access(nodeModulesPath).then(() => true).catch(() => false);

      if (!nodeModulesExists || this.force) {
        this.debug('Installing dependencies...');
        await execAsync('npm install', { cwd: process.cwd() });
        this.log('  ✓ Dependencies installed');
      } else {
        this.debug('Dependencies already installed');
        this.log('  ✓ Dependencies verified');
      }

      this.results.dependencies = 'success';
    } catch (error) {
      this.results.dependencies = 'failed';
      throw new Error(`Dependency check failed: ${error.message}`);
    }
  }

  async setupSupabase() {
    this.log('\n🗄️  Setting up Supabase...', COLORS.blue);

    try {
      // Check if Supabase is already running
      const isRunning = await this.checkSupabaseStatus();
      
      if (!isRunning || this.force) {
        this.debug('Starting Supabase...');
        
        // Try to start Supabase
        const startResult = await this.executeWithTimeout('supabase start', 60000);
        
        if (startResult.includes('Started supabase local development setup')) {
          this.log('  ✓ Supabase started successfully');
        } else {
          // Try to stop and start fresh
          await this.executeWithTimeout('supabase stop', 10000).catch(() => {});
          await this.executeWithTimeout('supabase start', 60000);
          this.log('  ✓ Supabase restarted successfully');
        }
      } else {
        this.log('  ✓ Supabase already running');
      }

      // Initialize Supabase client
      await this.initializeSupabaseClient();
      this.results.supabase = 'success';

    } catch (error) {
      this.results.supabase = 'failed';
      throw new Error(`Supabase setup failed: ${error.message}`);
    }
  }

  async checkSupabaseStatus() {
    try {
      const result = await execAsync('supabase status', { timeout: 5000 });
      return result.stdout.includes('API URL');
    } catch {
      return false;
    }
  }

  async initializeSupabaseClient() {
    try {
      // Read environment variables
      const envPath = path.join(process.cwd(), '.env.local');
      const envContent = await fs.readFile(envPath, 'utf8').catch(() => '');
      
      let supabaseUrl = 'http://127.0.0.1:54321';
      let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

      // Parse env file for custom values
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
      
      if (urlMatch) supabaseUrl = urlMatch[1];
      if (keyMatch) supabaseKey = keyMatch[1];

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Test connection
      const { error } = await this.supabase.from('user_profiles').select('id').limit(1);
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }

      this.debug('Supabase client initialized');

    } catch (error) {
      throw new Error(`Failed to initialize Supabase client: ${error.message}`);
    }
  }

  async applyMigrations() {
    this.log('\n📋 Applying database migrations...', COLORS.blue);

    try {
      // Check for pending migrations
      const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
      const migrationsExist = await fs.access(migrationsPath).then(() => true).catch(() => false);

      if (migrationsExist) {
        this.debug('Applying migrations...');
        await execAsync('supabase db push', { cwd: process.cwd() });
        this.log('  ✓ Migrations applied successfully');
      } else {
        this.log('  ✓ No migrations found (first setup)');
      }

      this.results.migrations = 'success';

    } catch (error) {
      // Try to recover from migration errors
      if (error.message.includes('migration') || error.message.includes('schema')) {
        this.debug('Migration error detected, attempting recovery...');
        
        try {
          // Reset and retry
          await execAsync('supabase db reset --no-confirm', { cwd: process.cwd() });
          await execAsync('supabase db push', { cwd: process.cwd() });
          this.log('  ✓ Migrations recovered and applied');
          this.results.migrations = 'recovered';
          return;
        } catch (recoveryError) {
          this.debug(`Recovery failed: ${recoveryError.message}`);
        }
      }

      this.results.migrations = 'failed';
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  async createDevelopmentUsers() {
    this.log('\n👤 Creating development users...', COLORS.blue);

    try {
      // Run the development user creation script
      const userScript = path.join(process.cwd(), 'scripts', 'create-development-users.js');
      const userScriptExists = await fs.access(userScript).then(() => true).catch(() => false);

      if (userScriptExists) {
        this.debug('Running user creation script...');
        
        // Set environment variables for the script
        const env = {
          ...process.env,
          SUPABASE_URL: 'http://127.0.0.1:54321',
          SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
        };

        const result = await execAsync('node scripts/create-development-users.js', { 
          cwd: process.cwd(),
          env 
        });
        
        this.debug('User creation output:');
        this.debug(result.stdout);
        
        this.log('  ✓ Development users created');
      } else {
        this.log('  ⚠️  User creation script not found, skipping...', COLORS.yellow);
      }

      this.results.users = 'success';

    } catch (error) {
      // User creation is not critical for basic setup
      this.log(`  ⚠️  User creation failed: ${error.message}`, COLORS.yellow);
      this.results.users = 'warning';
    }
  }

  async validateAuthSystem() {
    this.log('\n🔐 Validating authentication system...', COLORS.blue);

    try {
      // Check if auth validation script exists
      const authScript = path.join(process.cwd(), 'scripts', 'validate-auth-migration.js');
      const authScriptExists = await fs.access(authScript).then(() => true).catch(() => false);

      if (authScriptExists) {
        this.debug('Running auth validation...');
        
        const env = {
          ...process.env,
          SUPABASE_URL: 'http://127.0.0.1:54321',
          SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
        };

        await execAsync('node scripts/validate-auth-migration.js', { 
          cwd: process.cwd(),
          env,
          timeout: 30000
        });
        
        this.log('  ✓ Authentication system validated');
      } else {
        // Basic validation using Supabase client
        if (this.supabase) {
          const { data, error } = await this.supabase.from('user_profiles').select('id').limit(1);
          if (error && !error.message.includes('no rows returned')) {
            throw error;
          }
        }
        
        this.log('  ✓ Basic auth validation passed');
      }

      this.results.health = 'success';

    } catch (error) {
      this.results.health = 'warning';
      this.log(`  ⚠️  Auth validation warning: ${error.message}`, COLORS.yellow);
    }
  }

  async setupGitHooks() {
    this.log('\n🪝 Setting up git hooks...', COLORS.blue);

    try {
      // Check if husky is installed
      const huskyPath = path.join(process.cwd(), 'node_modules', '.bin', 'husky');
      const huskyExists = await fs.access(huskyPath).then(() => true).catch(() => false);

      if (huskyExists) {
        this.debug('Installing git hooks...');
        await execAsync('npx husky install', { cwd: process.cwd() });
        this.log('  ✓ Git hooks installed');
      } else {
        this.log('  ℹ️  Husky not found, skipping git hooks', COLORS.cyan);
      }

    } catch (error) {
      this.log(`  ⚠️  Git hooks setup warning: ${error.message}`, COLORS.yellow);
    }
  }

  async executeWithTimeout(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { cwd: process.cwd() });
      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data;
        if (this.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data;
        if (this.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput || output}`));
        }
      });

      // Timeout handling
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', () => clearTimeout(timer));
    });
  }

  printSummary() {
    this.log('\n📊 Setup Summary:', COLORS.blue);
    this.log('='.repeat(30));

    const statusSymbol = (status) => {
      switch (status) {
        case 'success': return '✅';
        case 'warning': return '⚠️ ';
        case 'recovered': return '🔄';
        case 'failed': return '❌';
        default: return '❓';
      }
    };

    Object.entries(this.results).forEach(([key, status]) => {
      if (status) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        this.log(`  ${statusSymbol(status)} ${label}: ${status}`);
      }
    });
  }

  printTroubleshootingTips() {
    this.log('\n🔧 Troubleshooting Tips:', COLORS.yellow);
    this.log('='.repeat(30));
    this.log('1. Make sure Docker is running (required for Supabase)');
    this.log('2. Check if ports 54321-54324 are available');
    this.log('3. Try running with --force flag to reset everything');
    this.log('4. Run with --verbose for detailed output');
    this.log('5. Check the MatchDay documentation for common issues');
    this.log('\n📖 Commands to try:');
    this.log('  npm run dev:reset  - Reset development environment');
    this.log('  npm run dev:init --force --verbose  - Force setup with debug');
  }
}

// Run the initializer
const initializer = new DevInitializer();
initializer.run().catch(() => process.exit(1));