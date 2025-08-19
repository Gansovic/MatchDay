/**
 * Shared Authentication Library for MatchDay
 * 
 * This is the unified authentication system used by all MatchDay applications.
 * It provides development-resilient auth with health monitoring and fallback mechanisms.
 */

export { 
  UnifiedAuthService,
  type AuthUser,
  type AuthSession,
  type SignUpData,
  type SignInData,
  type AuthHealth
} from './unified-auth.service';

// Re-export the singleton instance for easy access
import { UnifiedAuthService } from './unified-auth.service';
export const authService = UnifiedAuthService.getInstance();