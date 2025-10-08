/**
 * Environment Variable Validator
 *
 * Validates required environment variables are present and correctly formatted.
 * Prevents runtime errors from missing or invalid configuration.
 */

import { z } from 'zod';

// Define the schema for required environment variables
const envSchema = z.object({
  // Supabase Configuration (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL format')
    .refine(
      (url) => url.startsWith('http://127.0.0.1') || url.startsWith('https://'),
      'Supabase URL must use http:// (local) or https:// (production)'
    ),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'Supabase anon key seems too short - check your configuration')
    .refine(
      (key) => key.startsWith('eyJ') || key.startsWith('sb_publishable_'),
      'Supabase anon key must be a valid JWT or publishable key'
    ),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'Supabase service role key seems too short')
    .refine(
      (key) => key.startsWith('eyJ') || key.startsWith('sb_secret_'),
      'Supabase service role key must be a valid JWT or secret key'
    )
    .optional(), // Optional for client-side only apps

  // Application URLs
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('Invalid site URL format')
    .default('http://localhost:3000'),

  // Optional Configuration
  NEXT_PUBLIC_ADMIN_APP_URL: z
    .string()
    .url('Invalid admin app URL')
    .optional(),

  PLAYER_TEAM_ID: z.string().uuid().optional(),
  ADMIN_TEAM_ID: z.string().uuid().optional(),
  BOT_TEAM_ID: z.string().uuid().optional(),
  BOT2_TEAM_ID: z.string().uuid().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables at runtime
 *
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {EnvConfig} Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_ADMIN_APP_URL: process.env.NEXT_PUBLIC_ADMIN_APP_URL,
      PLAYER_TEAM_ID: process.env.PLAYER_TEAM_ID,
      ADMIN_TEAM_ID: process.env.ADMIN_TEAM_ID,
      BOT_TEAM_ID: process.env.BOT_TEAM_ID,
      BOT2_TEAM_ID: process.env.BOT2_TEAM_ID,
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Environment variable validation failed:\n${errorMessages}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.\n` +
        `See .env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Gets validated environment configuration
 * Safe to use - will throw clear errors if misconfigured
 */
export function getEnv(): EnvConfig {
  return validateEnv();
}

/**
 * Checks if running against production Supabase
 */
export function isProductionSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.startsWith('https://') && url.includes('supabase.co');
}

/**
 * Checks if running in local development
 */
export function isLocalDevelopment(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.includes('127.0.0.1') || url.includes('localhost');
}

/**
 * Warns if using production database in development
 */
export function warnIfProductionInDev(): void {
  if (process.env.NODE_ENV === 'development' && isProductionSupabase()) {
    console.warn(
      '⚠️  WARNING: You are running in DEVELOPMENT mode but connected to PRODUCTION Supabase!\n' +
      '⚠️  This is dangerous! Please update your .env.local to use local Supabase:\n' +
      '   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\n'
    );
  }
}
