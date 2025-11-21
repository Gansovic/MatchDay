/**
 * Environment Validation Utility for MatchDay
 *
 * Prevents database confusion by validating and clearly indicating
 * which environment (local/production) is currently active.
 */
export type Environment = 'development' | 'production' | 'test';
export interface EnvironmentConfig {
    env: Environment;
    supabaseUrl: string;
    supabaseAnonKey: string;
    siteUrl: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isLocal: boolean;
    isRemote: boolean;
    databaseType: 'local' | 'production';
    adminAppUrl?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    config: EnvironmentConfig | null;
}
/**
 * Validates environment configuration and returns detailed analysis
 */
export declare function validateEnvironment(): ValidationResult;
/**
 * Get current environment configuration (throws if invalid)
 */
export declare function getEnvironmentConfig(): EnvironmentConfig;
/**
 * Check if current environment is safe for destructive operations
 */
export declare function isSafeForDestructiveOperations(): boolean;
/**
 * Get environment display name with visual indicators
 */
export declare function getEnvironmentDisplayName(): string;
/**
 * Get database display name with clear indicators
 */
export declare function getDatabaseDisplayName(): string;
/**
 * Log environment status to console with visual formatting
 */
export declare function logEnvironmentStatus(): void;
/**
 * Create environment validation middleware for Next.js
 */
export declare function createEnvironmentMiddleware(): () => void;
/**
 * Runtime environment validation (call this at app startup)
 */
export declare function validateEnvironmentAtStartup(): void;
//# sourceMappingURL=validation.d.ts.map