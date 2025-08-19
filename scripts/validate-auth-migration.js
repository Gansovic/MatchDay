#!/usr/bin/env node

/**
 * Auth Migration Validation Script
 * 
 * This script validates that database migrations don't break critical auth functionality.
 * Run this before and after applying migrations to ensure auth system remains healthy.
 * 
 * Usage:
 *   node scripts/validate-auth-migration.js [--pre|--post] [--auto-fix]
 */

import { createClient } from '@supabase/supabase-js';

function validateEnvironment() {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Warn if this looks like production
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
    console.warn('⚠️  Running against external Supabase instance:', supabaseUrl);
    console.warn('   Please ensure this is safe and authorized');
  }
}

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

async function checkAuthIntegrity(supabase) {
  console.log('🔍 Checking auth system integrity...\n');
  
  try {
    const { data, error } = await supabase.rpc('check_auth_system_integrity');
    
    if (error) {
      console.error('❌ Failed to run integrity check:', error);
      return { healthy: false, errors: [error.message] };
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;
    
    console.log('📊 Integrity Check Results:');
    console.log('  Timestamp:', new Date(result.timestamp).toLocaleString());
    console.log('  Overall Health:', result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY');
    
    console.log('\n🔧 Individual Checks:');
    Object.entries(result.checks).forEach(([check, status]) => {
      const icon = status ? '✅' : '❌';
      const displayName = check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`  ${icon} ${displayName}`);
    });
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n🚨 Errors Found:');
      result.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Integrity check failed:', error);
    return { healthy: false, errors: [error.message] };
  }
}

async function backupAuthConfig(supabase) {
  console.log('💾 Creating auth configuration backup...\n');
  
  try {
    const { data, error } = await supabase.rpc('backup_auth_config');
    
    if (error) {
      throw error;
    }

    const backup = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Save backup to file
    const fs = await import('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `.auth-backup-${timestamp}.json`;
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log('✅ Auth configuration backed up to:', backupFile);
    console.log('   Backup includes:', Object.keys(backup).join(', '));
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Failed to backup auth config:', error);
    throw error;
  }
}

async function runEmergencyRecovery(supabase) {
  console.log('🚨 Running emergency auth recovery...\n');
  
  try {
    const { data, error } = await supabase.rpc('emergency_auth_recovery');
    
    if (error) {
      throw error;
    }

    console.log('🔧 Recovery Log:');
    console.log(data);
    
    // Recheck integrity after recovery
    console.log('\n🔍 Rechecking integrity after recovery...');
    const integrityResult = await checkAuthIntegrity(supabase);
    
    if (integrityResult.healthy) {
      console.log('✅ Emergency recovery successful!');
    } else {
      console.log('❌ Recovery did not fully resolve issues');
    }
    
    return integrityResult.healthy;
    
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    return false;
  }
}

async function logAuthStatus(supabase) {
  try {
    const { data, error } = await supabase.rpc('log_auth_system_status');
    
    if (error) {
      console.warn('⚠️  Failed to log auth status:', error);
    } else {
      console.log('📝 Auth status logged to database');
    }
  } catch (error) {
    console.warn('⚠️  Failed to log auth status:', error);
  }
}

async function validatePreMigration() {
  console.log('🔬 PRE-MIGRATION VALIDATION\n');
  console.log('This checks auth system health before applying migrations.\n');
  
  const supabase = getSupabaseClient();
  
  // Create backup
  const backupFile = await backupAuthConfig(supabase);
  
  // Check integrity
  const integrityResult = await checkAuthIntegrity(supabase);
  
  // Log status
  await logAuthStatus(supabase);
  
  if (!integrityResult.healthy) {
    console.log('\n⚠️  Auth system has issues before migration!');
    console.log('   Consider fixing these issues before proceeding with migration:');
    integrityResult.errors.forEach(error => console.log(`   • ${error}`));
    console.log(`\n💾 Configuration backup saved to: ${backupFile}`);
    console.log('   You can use this backup for recovery if needed.');
    process.exit(1);
  }
  
  console.log('\n✅ Auth system is healthy - safe to proceed with migration');
  console.log(`💾 Backup saved to: ${backupFile}`);
}

async function validatePostMigration(autoFix = false) {
  console.log('🔬 POST-MIGRATION VALIDATION\n');
  console.log('This checks auth system health after applying migrations.\n');
  
  const supabase = getSupabaseClient();
  
  // Check integrity
  const integrityResult = await checkAuthIntegrity(supabase);
  
  // Log status
  await logAuthStatus(supabase);
  
  if (!integrityResult.healthy) {
    console.log('\n🚨 Auth system has issues after migration!');
    
    if (autoFix) {
      console.log('\n🔧 Auto-fix enabled. Attempting emergency recovery...');
      const recoverySuccess = await runEmergencyRecovery(supabase);
      
      if (recoverySuccess) {
        console.log('\n✅ Emergency recovery successful!');
        console.log('   Auth system has been restored to working state.');
      } else {
        console.log('\n❌ Emergency recovery failed!');
        console.log('   Manual intervention required.');
        process.exit(1);
      }
    } else {
      console.log('\n💡 You can try automatic recovery with: --auto-fix');
      console.log('   Or run emergency recovery manually:');
      console.log('   SELECT emergency_auth_recovery();');
      process.exit(1);
    }
  } else {
    console.log('\n✅ Auth system is healthy after migration');
    console.log('   All critical auth functionality is working correctly.');
  }
}

async function main() {
  validateEnvironment();
  
  const args = process.argv.slice(2);
  const isPre = args.includes('--pre');
  const isPost = args.includes('--post');
  const autoFix = args.includes('--auto-fix');
  
  console.log('🔐 MatchDay Auth Migration Validator');
  console.log('=====================================\n');
  
  try {
    if (isPre) {
      await validatePreMigration();
    } else if (isPost) {
      await validatePostMigration(autoFix);
    } else {
      // Default: run both pre and post checks
      console.log('No specific mode specified. Running full integrity check...\n');
      
      const supabase = getSupabaseClient();
      await checkAuthIntegrity(supabase);
      await logAuthStatus(supabase);
      
      console.log('\n💡 Usage:');
      console.log('  --pre      Run before migrations');
      console.log('  --post     Run after migrations');
      console.log('  --auto-fix Automatically attempt fixes');
    }
    
  } catch (error) {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { validatePreMigration, validatePostMigration, checkAuthIntegrity };