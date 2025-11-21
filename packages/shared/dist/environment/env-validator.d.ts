/**
 * Environment Variable Validator
 *
 * Validates required environment variables are present and correctly formatted.
 * Prevents runtime errors from missing or invalid configuration.
 */
import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_SITE_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_ADMIN_APP_URL: z.ZodOptional<z.ZodString>;
    PLAYER_TEAM_ID: z.ZodOptional<z.ZodString>;
    ADMIN_TEAM_ID: z.ZodOptional<z.ZodString>;
    BOT_TEAM_ID: z.ZodOptional<z.ZodString>;
    BOT2_TEAM_ID: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EnvConfig = z.infer<typeof envSchema>;
/**
 * Validates environment variables at runtime
 *
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {EnvConfig} Validated environment configuration
 */
export declare function validateEnv(): EnvConfig;
/**
 * Gets validated environment configuration
 * Safe to use - will throw clear errors if misconfigured
 */
export declare function getEnv(): EnvConfig;
/**
 * Checks if running against production Supabase
 */
export declare function isProductionSupabase(): boolean;
/**
 * Checks if running in local development
 */
export declare function isLocalDevelopment(): boolean;
/**
 * Warns if using production database in development
 */
export declare function warnIfProductionInDev(): void;
export {};
//# sourceMappingURL=env-validator.d.ts.map