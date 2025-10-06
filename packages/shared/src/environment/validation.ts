/**
 * Environment Validation Utility for MatchDay
 * 
 * Prevents database confusion by validating and clearly indicating
 * which environment (local/production) is currently active.
 */

export type Environment = 'development' | 'production' | 'test'

export interface EnvironmentConfig {
  env: Environment
  supabaseUrl: string
  supabaseAnonKey: string
  siteUrl: string
  isDevelopment: boolean
  isProduction: boolean
  isLocal: boolean
  isRemote: boolean
  databaseType: 'local' | 'production'
  adminAppUrl?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: EnvironmentConfig | null
}

/**
 * Validates environment configuration and returns detailed analysis
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const adminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL
  const nodeEnv = process.env.NODE_ENV as Environment || 'development'
  
  // Validate required variables
  if (!supabaseUrl) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  
  if (!supabaseAnonKey) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }
  
  if (!siteUrl) {
    errors.push('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }
  
  // Early return if critical variables missing
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      config: null
    }
  }
  
  // Determine database type and environment characteristics
  const isLocal = supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1') || false
  const isRemote = !isLocal
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'
  const databaseType: 'local' | 'production' = isLocal ? 'local' : 'production'
  
  // Validate URL format
  try {
    new URL(supabaseUrl!)
  } catch {
    errors.push(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`)
  }
  
  try {
    new URL(siteUrl!)
  } catch {
    errors.push(`Invalid NEXT_PUBLIC_SITE_URL format: ${siteUrl}`)
  }
  
  // Environment consistency checks
  if (isDevelopment && isRemote) {
    warnings.push('⚠️  DEVELOPMENT mode is using PRODUCTION database - this may be intentional but verify!')
  }
  
  if (isProduction && isLocal) {
    errors.push('❌ PRODUCTION mode cannot use LOCAL database')
  }
  
  // Database URL validation
  if (isLocal) {
    if (!supabaseUrl?.match(/localhost:5432\d/)) {
      warnings.push(`Local database URL doesn't match expected pattern (localhost:5432x): ${supabaseUrl}`)
    }
  } else {
    if (!supabaseUrl?.includes('.supabase.co')) {
      warnings.push(`Production database URL doesn't match expected Supabase pattern: ${supabaseUrl}`)
    }
  }
  
  // Create config object
  const config: EnvironmentConfig = {
    env: nodeEnv,
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    siteUrl: siteUrl!,
    isDevelopment,
    isProduction,
    isLocal,
    isRemote,
    databaseType,
    adminAppUrl
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  }
}

/**
 * Get current environment configuration (throws if invalid)
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const result = validateEnvironment()
  
  if (!result.isValid || !result.config) {
    throw new Error(`Invalid environment configuration:\n${result.errors.join('\n')}`)
  }
  
  return result.config
}

/**
 * Check if current environment is safe for destructive operations
 */
export function isSafeForDestructiveOperations(): boolean {
  try {
    const config = getEnvironmentConfig()
    return config.isDevelopment || config.isLocal
  } catch {
    return false
  }
}

/**
 * Get environment display name with visual indicators
 */
export function getEnvironmentDisplayName(): string {
  try {
    const config = getEnvironmentConfig()
    
    if (config.isLocal) {
      return `🟢 LOCAL (${config.env})`
    } else {
      return `🔴 PRODUCTION (${config.env})`
    }
  } catch {
    return '❓ UNKNOWN'
  }
}

/**
 * Get database display name with clear indicators
 */
export function getDatabaseDisplayName(): string {
  try {
    const config = getEnvironmentConfig()
    const url = new URL(config.supabaseUrl)
    
    if (config.isLocal) {
      return `🏠 Local Database (${url.host})`
    } else {
      return `☁️  Production Database (${url.hostname})`
    }
  } catch {
    return '❓ Unknown Database'
  }
}

/**
 * Log environment status to console with visual formatting
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment()
  
  console.group('🔧 Environment Configuration')
  
  if (result.config) {
    const config = result.config
    
    console.log(`Environment: ${getEnvironmentDisplayName()}`)
    console.log(`Database: ${getDatabaseDisplayName()}`)
    console.log(`Site URL: ${config.siteUrl}`)
    
    if (config.adminAppUrl) {
      console.log(`Admin URL: ${config.adminAppUrl}`)
    }
    
    if (result.warnings.length > 0) {
      console.group('⚠️  Warnings')
      result.warnings.forEach(warning => console.warn(warning))
      console.groupEnd()
    }
  }
  
  if (result.errors.length > 0) {
    console.group('❌ Errors')
    result.errors.forEach(error => console.error(error))
    console.groupEnd()
  }
  
  console.groupEnd()
}

/**
 * Create environment validation middleware for Next.js
 */
export function createEnvironmentMiddleware() {
  return () => {
    const result = validateEnvironment()
    
    if (!result.isValid) {
      throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`)
    }
    
    // Log environment status in development
    if (result.config?.isDevelopment) {
      logEnvironmentStatus()
    }
  }
}

/**
 * Runtime environment validation (call this at app startup)
 */
export function validateEnvironmentAtStartup(): void {
  try {
    const middleware = createEnvironmentMiddleware()
    middleware()
    
    const config = getEnvironmentConfig()
    
    // Show prominent warning for production database usage
    if (config.isRemote && config.isDevelopment) {
      console.warn('\n' + '='.repeat(60))
      console.warn('⚠️  WARNING: USING PRODUCTION DATABASE IN DEVELOPMENT!')
      console.warn(`Database: ${getDatabaseDisplayName()}`)
      console.warn('Make sure this is intentional!')
      console.warn('='.repeat(60) + '\n')
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ ENVIRONMENT VALIDATION FAILED!')
    console.error(error instanceof Error ? error.message : String(error))
    console.error('='.repeat(60) + '\n')
    throw error
  }
}