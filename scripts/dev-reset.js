#!/usr/bin/env node

/**
 * MatchDay Development Environment Reset Script
 * 
 * Quick script to reset the development environment when things go wrong.
 * Cleans up state, resets databases, and gets you back to a clean state.
 * 
 * Usage:
 *   npm run dev:reset
 *   node scripts/dev-reset.js [--hard] [--keep-data] [--verbose]
 */

import { exec } from 'child_process';
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

class DevResetter {
  constructor() {
    this.verbose = process.argv.includes('--verbose');
    this.hard = process.argv.includes('--hard');
    this.keepData = process.argv.includes('--keep-data');
    this.steps = [];
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
    this.log(`\n🔄 ${COLORS.bold}MatchDay Development Environment Reset${COLORS.reset}`, COLORS.blue);
    
    if (this.hard) {
      this.log('⚠️  Hard reset mode - all data will be lost!', COLORS.yellow);
    }
    
    if (this.keepData) {
      this.log('💾 Keep data mode - preserving user data', COLORS.green);
    }
    
    this.log('='.repeat(50));

    // Ask for confirmation on hard reset
    if (this.hard && !process.argv.includes('--yes')) {
      const confirmation = await this.confirm(
        'This will delete all development data. Are you sure? (y/N): '
      );
      
      if (!confirmation) {
        this.log('Reset cancelled.', COLORS.yellow);
        return;
      }
    }

    try {
      await this.stopDevelopmentServers();
      await this.resetSupabase();
      await this.clearCache();
      await this.resetDependencies();
      await this.cleanupTempFiles();
      await this.restartEnvironment();
      
      this.printSummary();
      this.log('\n✅ Environment reset complete!', COLORS.green);
      this.log('💡 Run `npm run dev:init` to set up a fresh environment', COLORS.cyan);
      
    } catch (error) {
      this.log(`\n❌ Reset failed: ${error.message}`, COLORS.red);
      
      if (this.verbose) {
        console.error(error);
      }
      
      this.printRecoveryOptions();
      process.exit(1);
    }
  }

  async stopDevelopmentServers() {
    this.log('\n🛑 Stopping development servers...', COLORS.blue);

    try {
      // Stop Next.js development servers (both main and admin)
      await this.killProcessOnPorts([3000, 3001, 3002]);
      
      // Stop Supabase if running
      try {
        await execAsync('supabase stop', { timeout: 10000 });
        this.debug('Supabase stopped');
      } catch (error) {
        this.debug(`Supabase stop warning: ${error.message}`);
      }
      
      this.log('  ✓ Development servers stopped');
      this.steps.push({ name: 'Stop servers', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Stop servers', status: 'warning' });
      this.log(`  ⚠️  Server stop warning: ${error.message}`, COLORS.yellow);
    }
  }

  async resetSupabase() {
    this.log('\n🗄️  Resetting Supabase...', COLORS.blue);

    try {
      if (this.hard) {
        this.debug('Performing hard Supabase reset...');
        
        // Remove Supabase volumes and containers
        try {
          await execAsync('docker stop $(docker ps -q --filter "name=supabase") 2>/dev/null || true');
          await execAsync('docker rm $(docker ps -aq --filter "name=supabase") 2>/dev/null || true');
          await execAsync('docker volume rm $(docker volume ls -q --filter "name=supabase") 2>/dev/null || true');
        } catch (error) {
          this.debug(`Docker cleanup warning: ${error.message}`);
        }

        // Remove Supabase config if it exists
        const supabaseConfigPath = path.join(process.cwd(), '.supabase');
        await fs.rm(supabaseConfigPath, { recursive: true, force: true });
        
        this.log('  ✓ Hard Supabase reset completed');
      } else {
        // Soft reset - just reset the database
        try {
          if (!this.keepData) {
            this.debug('Resetting database...');
            await execAsync('supabase db reset --no-confirm', { timeout: 30000 });
          } else {
            this.debug('Keeping data, just restarting...');
            await execAsync('supabase stop', { timeout: 10000 });
          }
          
          this.log('  ✓ Supabase database reset');
        } catch (error) {
          this.debug(`Database reset warning: ${error.message}`);
          this.log('  ⚠️  Database reset had issues, will restart fresh', COLORS.yellow);
        }
      }

      this.steps.push({ name: 'Reset Supabase', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Reset Supabase', status: 'warning' });
      this.log(`  ⚠️  Supabase reset warning: ${error.message}`, COLORS.yellow);
    }
  }

  async clearCache() {
    this.log('\n🧹 Clearing caches...', COLORS.blue);

    try {
      const cachePaths = [
        path.join(process.cwd(), '.next'),
        path.join(process.cwd(), 'node_modules/.cache'),
        path.join(process.cwd(), 'matchday-admin/.next'),
        path.join(process.cwd(), 'matchday-admin/node_modules/.cache'),
        path.join(process.cwd(), '.dev-credentials.json'),
        path.join(process.cwd(), 'error-logs.json')
      ];

      for (const cachePath of cachePaths) {
        try {
          await fs.rm(cachePath, { recursive: true, force: true });
          this.debug(`Cleared: ${path.basename(cachePath)}`);
        } catch (error) {
          this.debug(`Skipped: ${path.basename(cachePath)} (${error.message})`);
        }
      }

      // Clear browser cache files if they exist
      const tempFiles = [
        '.DS_Store',
        'Thumbs.db',
        '*.log',
        'npm-debug.log*',
        '.npm'
      ];

      this.log('  ✓ Caches cleared');
      this.steps.push({ name: 'Clear caches', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Clear caches', status: 'warning' });
      this.log(`  ⚠️  Cache clearing warning: ${error.message}`, COLORS.yellow);
    }
  }

  async resetDependencies() {
    this.log('\n📦 Resetting dependencies...', COLORS.blue);

    try {
      if (this.hard) {
        this.debug('Removing node_modules...');
        
        // Remove node_modules from both main and admin apps
        const nodeModulesPaths = [
          path.join(process.cwd(), 'node_modules'),
          path.join(process.cwd(), 'matchday-admin/node_modules')
        ];

        for (const modulesPath of nodeModulesPaths) {
          await fs.rm(modulesPath, { recursive: true, force: true });
          this.debug(`Removed: ${path.relative(process.cwd(), modulesPath)}`);
        }

        // Remove package-lock.json files
        const lockFiles = [
          path.join(process.cwd(), 'package-lock.json'),
          path.join(process.cwd(), 'matchday-admin/package-lock.json')
        ];

        for (const lockFile of lockFiles) {
          await fs.rm(lockFile, { force: true });
          this.debug(`Removed: ${path.relative(process.cwd(), lockFile)}`);
        }

        this.log('  ✓ Dependencies removed (will be reinstalled)');
      } else {
        this.log('  ✓ Dependencies kept (soft reset)');
      }

      this.steps.push({ name: 'Reset dependencies', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Reset dependencies', status: 'warning' });
      this.log(`  ⚠️  Dependency reset warning: ${error.message}`, COLORS.yellow);
    }
  }

  async cleanupTempFiles() {
    this.log('\n🗑️  Cleaning up temporary files...', COLORS.blue);

    try {
      // Clean up common temporary files
      const patterns = [
        '*.tmp',
        '*.temp',
        '.env.local.backup',
        'debug.log',
        'error.log'
      ];

      const files = await fs.readdir(process.cwd());
      let cleaned = 0;

      for (const file of files) {
        if (patterns.some(pattern => {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        })) {
          await fs.rm(path.join(process.cwd(), file), { force: true });
          this.debug(`Cleaned: ${file}`);
          cleaned++;
        }
      }

      this.log(`  ✓ Cleaned ${cleaned} temporary files`);
      this.steps.push({ name: 'Cleanup temp files', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Cleanup temp files', status: 'warning' });
      this.log(`  ⚠️  Temp file cleanup warning: ${error.message}`, COLORS.yellow);
    }
  }

  async restartEnvironment() {
    this.log('\n🚀 Restarting environment...', COLORS.blue);

    try {
      if (this.hard) {
        // Full restart with fresh install
        this.debug('Installing dependencies...');
        await execAsync('npm install', { cwd: process.cwd() });
        
        // Install admin app dependencies if it exists
        const adminPath = path.join(process.cwd(), 'matchday-admin');
        const adminExists = await fs.access(adminPath).then(() => true).catch(() => false);
        
        if (adminExists) {
          this.debug('Installing admin app dependencies...');
          await execAsync('npm install', { cwd: adminPath });
        }
      }

      this.debug('Starting Supabase...');
      await execAsync('supabase start', { timeout: 60000 });
      
      this.log('  ✓ Environment restarted');
      this.steps.push({ name: 'Restart environment', status: 'success' });

    } catch (error) {
      this.steps.push({ name: 'Restart environment', status: 'failed' });
      throw new Error(`Environment restart failed: ${error.message}`);
    }
  }

  async killProcessOnPorts(ports) {
    for (const port of ports) {
      try {
        const result = await execAsync(`lsof -ti:${port}`);
        const pids = result.stdout.trim().split('\n').filter(Boolean);
        
        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`);
          this.debug(`Killed process ${pid} on port ${port}`);
        }
      } catch (error) {
        // No process on port, which is fine
        this.debug(`No process found on port ${port}`);
      }
    }
  }

  async confirm(question) {
    return new Promise((resolve) => {
      process.stdout.write(question);
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        resolve(answer === 'y' || answer === 'yes');
      });
    });
  }

  printSummary() {
    this.log('\n📊 Reset Summary:', COLORS.blue);
    this.log('='.repeat(30));

    const statusSymbol = (status) => {
      switch (status) {
        case 'success': return '✅';
        case 'warning': return '⚠️ ';
        case 'failed': return '❌';
        default: return '❓';
      }
    };

    this.steps.forEach(step => {
      this.log(`  ${statusSymbol(step.status)} ${step.name}`);
    });
  }

  printRecoveryOptions() {
    this.log('\n🆘 Recovery Options:', COLORS.yellow);
    this.log('='.repeat(30));
    this.log('1. Try running the reset again with --verbose');
    this.log('2. Manual cleanup:');
    this.log('   - docker stop $(docker ps -q --filter "name=supabase")');
    this.log('   - docker rm $(docker ps -aq --filter "name=supabase")');
    this.log('   - rm -rf node_modules package-lock.json');
    this.log('3. Check if Docker is running');
    this.log('4. Restart Docker and try again');
    this.log('\n📖 Commands to try:');
    this.log('  npm run dev:reset --hard  - Nuclear option');
    this.log('  npm run dev:init --force  - Fresh setup after reset');
  }
}

// Run the resetter
const resetter = new DevResetter();
resetter.run().catch(() => process.exit(1));