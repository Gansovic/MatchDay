(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/packages/shared/src/utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": ()=>cn
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$3$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@3.3.1/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$3$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/shared/src/environment/validation.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Environment Validation Utility for MatchDay
 * 
 * Prevents database confusion by validating and clearly indicating
 * which environment (local/production) is currently active.
 */ __turbopack_context__.s({
    "createEnvironmentMiddleware": ()=>createEnvironmentMiddleware,
    "getDatabaseDisplayName": ()=>getDatabaseDisplayName,
    "getEnvironmentConfig": ()=>getEnvironmentConfig,
    "getEnvironmentDisplayName": ()=>getEnvironmentDisplayName,
    "isSafeForDestructiveOperations": ()=>isSafeForDestructiveOperations,
    "logEnvironmentStatus": ()=>logEnvironmentStatus,
    "validateEnvironment": ()=>validateEnvironment,
    "validateEnvironmentAtStartup": ()=>validateEnvironmentAtStartup
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    // Get environment variables
    const supabaseUrl = ("TURBOPACK compile-time value", "https://twkipeacdamypppxmmhe.supabase.co");
    const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4");
    const siteUrl = ("TURBOPACK compile-time value", "http://localhost:3000");
    const adminAppUrl = ("TURBOPACK compile-time value", "http://localhost:3001");
    const nodeEnv = ("TURBOPACK compile-time value", "development") || 'development';
    // Validate required variables
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Early return if critical variables missing
    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
            warnings,
            config: null
        };
    }
    // Determine database type and environment characteristics
    const isLocal = (supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.includes('localhost')) || (supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.includes('127.0.0.1')) || false;
    const isRemote = !isLocal;
    const isDevelopment = nodeEnv === 'development';
    const isProduction = nodeEnv === 'production';
    const databaseType = isLocal ? 'local' : 'production';
    // Validate URL format
    try {
        new URL(supabaseUrl);
    } catch (e) {
        errors.push("Invalid NEXT_PUBLIC_SUPABASE_URL format: ".concat(supabaseUrl));
    }
    try {
        new URL(siteUrl);
    } catch (e) {
        errors.push("Invalid NEXT_PUBLIC_SITE_URL format: ".concat(siteUrl));
    }
    // Environment consistency checks
    if (isDevelopment && isRemote) {
        warnings.push('⚠️  DEVELOPMENT mode is using PRODUCTION database - this may be intentional but verify!');
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Database URL validation
    if (isLocal) {
        if (!(supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.match(/localhost:5432\d/))) {
            warnings.push("Local database URL doesn't match expected pattern (localhost:5432x): ".concat(supabaseUrl));
        }
    } else {
        if (!(supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.includes('.supabase.co'))) {
            warnings.push("Production database URL doesn't match expected Supabase pattern: ".concat(supabaseUrl));
        }
    }
    // Create config object
    const config = {
        env: nodeEnv,
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: supabaseAnonKey,
        siteUrl: siteUrl,
        isDevelopment,
        isProduction,
        isLocal,
        isRemote,
        databaseType,
        adminAppUrl
    };
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        config
    };
}
function getEnvironmentConfig() {
    const result = validateEnvironment();
    if (!result.isValid || !result.config) {
        throw new Error("Invalid environment configuration:\n".concat(result.errors.join('\n')));
    }
    return result.config;
}
function isSafeForDestructiveOperations() {
    try {
        const config = getEnvironmentConfig();
        return config.isDevelopment || config.isLocal;
    } catch (e) {
        return false;
    }
}
function getEnvironmentDisplayName() {
    try {
        const config = getEnvironmentConfig();
        if (config.isLocal) {
            return "🟢 LOCAL (".concat(config.env, ")");
        } else {
            return "🔴 PRODUCTION (".concat(config.env, ")");
        }
    } catch (e) {
        return '❓ UNKNOWN';
    }
}
function getDatabaseDisplayName() {
    try {
        const config = getEnvironmentConfig();
        const url = new URL(config.supabaseUrl);
        if (config.isLocal) {
            return "🏠 Local Database (".concat(url.host, ")");
        } else {
            return "☁️  Production Database (".concat(url.hostname, ")");
        }
    } catch (e) {
        return '❓ Unknown Database';
    }
}
function logEnvironmentStatus() {
    const result = validateEnvironment();
    console.group('🔧 Environment Configuration');
    if (result.config) {
        const config = result.config;
        console.log("Environment: ".concat(getEnvironmentDisplayName()));
        console.log("Database: ".concat(getDatabaseDisplayName()));
        console.log("Site URL: ".concat(config.siteUrl));
        if (config.adminAppUrl) {
            console.log("Admin URL: ".concat(config.adminAppUrl));
        }
        if (result.warnings.length > 0) {
            console.group('⚠️  Warnings');
            result.warnings.forEach((warning)=>console.warn(warning));
            console.groupEnd();
        }
    }
    if (result.errors.length > 0) {
        console.group('❌ Errors');
        result.errors.forEach((error)=>console.error(error));
        console.groupEnd();
    }
    console.groupEnd();
}
function createEnvironmentMiddleware() {
    return ()=>{
        var _result_config;
        const result = validateEnvironment();
        if (!result.isValid) {
            throw new Error("Environment validation failed:\n".concat(result.errors.join('\n')));
        }
        // Log environment status in development
        if ((_result_config = result.config) === null || _result_config === void 0 ? void 0 : _result_config.isDevelopment) {
            logEnvironmentStatus();
        }
    };
}
function validateEnvironmentAtStartup() {
    try {
        const middleware = createEnvironmentMiddleware();
        middleware();
        const config = getEnvironmentConfig();
        // Show prominent warning for production database usage
        if (config.isRemote && config.isDevelopment) {
            console.warn('\n' + '='.repeat(60));
            console.warn('⚠️  WARNING: USING PRODUCTION DATABASE IN DEVELOPMENT!');
            console.warn("Database: ".concat(getDatabaseDisplayName()));
            console.warn('Make sure this is intentional!');
            console.warn('='.repeat(60) + '\n');
        }
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ENVIRONMENT VALIDATION FAILED!');
        console.error(error instanceof Error ? error.message : String(error));
        console.error('='.repeat(60) + '\n');
        throw error;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/shared/src/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * @matchday/shared
 *
 * Shared utilities and helpers for MatchDay monorepo
 */ __turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/src/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$environment$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/src/environment/validation.ts [app-client] (ecmascript)");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/shared/src/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/src/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$environment$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/src/environment/validation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/shared/src/index.ts [app-client] (ecmascript) <locals>");
}),
"[project]/apps/player/src/lib/supabase/client.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Supabase Client Configuration for MatchDay
 * 
 * Proper Next.js 15 App Router + Supabase Cloud integration using @supabase/ssr
 * Handles client-side, server-side, and SSR authentication consistently
 * 
 * Includes environment validation to prevent database confusion
 */ __turbopack_context__.s({
    "clearAuthCookies": ()=>clearAuthCookies,
    "getAuthRedirectUrl": ()=>getAuthRedirectUrl,
    "getCurrentSession": ()=>getCurrentSession,
    "getCurrentUser": ()=>getCurrentUser,
    "isInvalidJWTError": ()=>isInvalidJWTError,
    "supabase": ()=>supabase,
    "validateSessionHealth": ()=>validateSessionHealth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$7$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$57$2e$4$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+ssr@0.7.0_@supabase+supabase-js@2.57.4/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$7$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$57$2e$4$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+ssr@0.7.0_@supabase+supabase-js@2.57.4/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/shared/src/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$environment$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/src/environment/validation.ts [app-client] (ecmascript)");
;
;
// Validate environment at startup to prevent database confusion
(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$environment$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateEnvironmentAtStartup"])();
// Get validated environment configuration
const envConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$src$2f$environment$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEnvironmentConfig"])();
const { supabaseUrl, supabaseAnonKey } = envConfig;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$7$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$57$2e$4$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
        name: 'matchday-auth',
        lifetime: 60 * 60 * 24 * 7,
        domain: undefined,
        path: '/',
        sameSite: 'lax'
    }
});
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error getting current user:', error);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Unexpected error getting current user:', error);
        return null;
    }
}
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting current session:', error);
            return null;
        }
        return session;
    } catch (error) {
        console.error('Unexpected error getting current session:', error);
        return null;
    }
}
function getAuthRedirectUrl() {
    let path = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : '/dashboard';
    const baseUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    return "".concat(baseUrl).concat(path);
}
function clearAuthCookies() {
    if (typeof document === 'undefined') return;
    // Clear all Supabase auth cookies
    const cookieNames = [
        'matchday-auth',
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'supabase.auth.token'
    ];
    cookieNames.forEach((cookieName)=>{
        // Clear cookie with various path and domain combinations
        const clearCookie = function(domain) {
            let path = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : '/';
            let cookieString = "".concat(cookieName, "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=").concat(path, ";");
            if (domain) cookieString += " domain=".concat(domain, ";");
            document.cookie = cookieString;
        };
        // Clear with different path/domain combinations
        clearCookie();
        clearCookie(undefined, '/');
        clearCookie(window.location.hostname);
        clearCookie(".".concat(window.location.hostname));
    });
    // Also clear localStorage auth items
    if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach((key)=>{
            if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
            }
        });
    }
    console.log('🧹 Cleared all authentication cookies and localStorage');
}
function isInvalidJWTError(error) {
    if (!error) return false;
    const message = error.message || error.toString();
    return message.includes('invalid JWT') || message.includes('signature is invalid') || message.includes('unable to parse or verify signature');
}
async function validateSessionHealth(session) {
    if (!(session === null || session === void 0 ? void 0 : session.access_token)) return false;
    try {
        // Try a simple authenticated request to validate the token
        const { data, error } = await supabase.auth.getUser();
        if (error && isInvalidJWTError(error)) {
            console.log('🚨 Session health check failed: Invalid JWT detected');
            return false;
        }
        return !error && !!data.user;
    } catch (error) {
        if (isInvalidJWTError(error)) {
            console.log('🚨 Session health check failed: Invalid JWT detected');
            return false;
        }
        return false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/player/src/lib/auth/validator.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Centralized Authentication Validator
 * 
 * Single source of truth for authentication validation across the application.
 * Provides consistent validation logic for both client and server-side usage.
 */ __turbopack_context__.s({
    "isTokenNearExpiry": ()=>isTokenNearExpiry,
    "refreshAuthSession": ()=>refreshAuthSession,
    "validateAuthenticationState": ()=>validateAuthenticationState,
    "validateSessionHealth": ()=>validateSessionHealth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/lib/supabase/client.ts [app-client] (ecmascript)");
;
async function validateAuthenticationState() {
    try {
        console.log('🔍 Validating authentication state...');
        // Step 1: Check if we have a session
        const { data: { session }, error: sessionError } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        if (sessionError) {
            console.log('🔍 Session error:', sessionError.message);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isInvalidJWTError"])(sessionError)) {
                return {
                    isValid: false,
                    status: 'invalid_token',
                    session: null,
                    user: null,
                    reason: sessionError.message,
                    shouldClearCookies: true,
                    shouldRedirectToLogin: true,
                    action: 'clear_cookies'
                };
            }
            return {
                isValid: false,
                status: 'validation_failed',
                session: null,
                user: null,
                reason: sessionError.message,
                shouldClearCookies: false,
                shouldRedirectToLogin: false,
                action: 'retry'
            };
        }
        if (!session) {
            console.log('🔍 No session found');
            return {
                isValid: false,
                status: 'no_session',
                session: null,
                user: null,
                shouldClearCookies: false,
                shouldRedirectToLogin: true,
                action: 'redirect_login'
            };
        }
        // Step 2: Check token expiry
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;
        if (expiresAt <= now) {
            console.log('🔍 Token expired');
            return {
                isValid: false,
                status: 'expired',
                session,
                user: session.user,
                reason: 'Token has expired',
                shouldClearCookies: false,
                shouldRedirectToLogin: false,
                action: 'refresh_token'
            };
        }
        // Step 3: Validate token with server (optional during initialization)
        try {
            // Add timeout and error handling to prevent blocking initialization
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), 3000); // 3 second timeout
            const healthResponse = await fetch('/api/auth/health', {
                credentials: 'include',
                headers: {
                    'Authorization': "Bearer ".concat(session.access_token)
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('🔍 Health check failed:', healthData.status);
                return {
                    isValid: false,
                    status: healthData.status === 'INVALID_TOKEN' ? 'invalid_token' : 'validation_failed',
                    session,
                    user: session.user,
                    reason: healthData.message,
                    shouldClearCookies: healthData.action === 'CLEAR_COOKIES_AND_REAUTH',
                    shouldRedirectToLogin: healthData.action !== 'RETRY_OR_REAUTH',
                    action: healthData.action === 'CLEAR_COOKIES_AND_REAUTH' ? 'clear_cookies' : 'retry'
                };
            }
            const healthData = await healthResponse.json();
            console.log('🔍 Authentication state is healthy');
            return {
                isValid: true,
                status: 'healthy',
                session,
                user: session.user,
                shouldClearCookies: false,
                shouldRedirectToLogin: false,
                action: 'none'
            };
        } catch (healthError) {
            var _healthError_message;
            console.log('🔍 Health check request failed (gracefully degrading):', healthError);
            // Graceful degradation: If health check fails during initialization,
            // assume the session is valid if it passes local validation
            // This prevents circular dependency issues during app startup
            if (healthError.name === 'AbortError') {
                console.log('🔍 Health check timed out - assuming valid session for now');
            } else if ((_healthError_message = healthError.message) === null || _healthError_message === void 0 ? void 0 : _healthError_message.includes('fetch')) {
                console.log('🔍 Health endpoint not available - assuming valid session for now');
            }
            // Fall back to local validation only
            return {
                isValid: true,
                status: 'healthy',
                session,
                user: session.user,
                shouldClearCookies: false,
                shouldRedirectToLogin: false,
                action: 'none'
            };
        }
    } catch (error) {
        console.error('🔍 Authentication validation error:', error);
        return {
            isValid: false,
            status: 'validation_failed',
            session: null,
            user: null,
            reason: error instanceof Error ? error.message : 'Unknown validation error',
            shouldClearCookies: false,
            shouldRedirectToLogin: false,
            action: 'retry'
        };
    }
}
async function validateSessionHealth(session) {
    if (!(session === null || session === void 0 ? void 0 : session.access_token)) return false;
    try {
        // Check token expiry first (local check, no network)
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;
        if (expiresAt <= now) {
            console.log('🔍 Token expired (local check)');
            return false;
        }
        // Validate with server
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        if (error && (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isInvalidJWTError"])(error)) {
            console.log('🔍 Invalid JWT detected in health check');
            return false;
        }
        return !error && !!data.user;
    } catch (error) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isInvalidJWTError"])(error)) {
            console.log('🔍 Invalid JWT detected in health check (catch)');
            return false;
        }
        return false;
    }
}
function isTokenNearExpiry(session) {
    if (!(session === null || session === void 0 ? void 0 : session.expires_at)) return false;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const twoMinutes = 2 * 60;
    return expiresAt - now <= twoMinutes;
}
async function refreshAuthSession() {
    try {
        console.log('🔄 Attempting to refresh auth session...');
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
        if (error) {
            console.log('🔄 Session refresh failed:', error.message);
            return {
                success: false,
                session: null,
                error: error.message
            };
        }
        console.log('🔄 Session refreshed successfully');
        return {
            success: true,
            session: data.session
        };
    } catch (error) {
        console.log('🔄 Session refresh error:', error);
        return {
            success: false,
            session: null,
            error: error instanceof Error ? error.message : 'Unknown refresh error'
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/player/src/components/auth/supabase-auth-provider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Robust Supabase Authentication Provider
 * 
 * Advanced authentication system with:
 * - Atomic state management (no split-brain issues)
 * - Proactive health monitoring
 * - Automatic token refresh and recovery
 * - Consistent frontend/backend authentication state
 */ __turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "getSession": ()=>getSession,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/lib/supabase/client.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$auth$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/lib/auth/validator.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const AuthProvider = (param)=>{
    let { children } = param;
    _s();
    // Atomic authentication state
    const [authState, setAuthState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        user: null,
        session: null,
        isValid: false,
        isLoading: true,
        lastValidated: null,
        validationStatus: 'initial'
    });
    // Refs for cleanup
    const mounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const healthCheckInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    const refreshCheckInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    // Atomic state update function
    const updateAuthState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[updateAuthState]": async (validation)=>{
            if (!mounted.current) return;
            console.log('🔄 Updating auth state:', validation.status);
            setAuthState({
                user: validation.user,
                session: validation.session,
                isValid: validation.isValid,
                isLoading: false,
                lastValidated: new Date(),
                validationStatus: validation.status
            });
            // Handle recovery actions
            if (validation.shouldClearCookies) {
                console.log('🧹 Clearing corrupted cookies');
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAuthCookies"])();
            }
        }
    }["AuthProvider.useCallback[updateAuthState]"], []);
    // Comprehensive authentication validation
    const validateAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[validateAuth]": async ()=>{
            const validation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$auth$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthenticationState"])();
            await updateAuthState(validation);
            return validation;
        }
    }["AuthProvider.useCallback[validateAuth]"], [
        updateAuthState
    ]);
    // Refresh session manually
    const refreshSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[refreshSession]": async ()=>{
            try {
                const { success, session: newSession } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$auth$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["refreshAuthSession"])();
                if (success && newSession) {
                    // Validate the new session
                    const validation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$auth$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthenticationState"])();
                    await updateAuthState(validation);
                    return validation.isValid;
                }
                return false;
            } catch (error) {
                console.error('Manual session refresh failed:', error);
                return false;
            }
        }
    }["AuthProvider.useCallback[refreshSession]"], [
        updateAuthState
    ]);
    // Initial authentication setup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            mounted.current = true;
            const initializeAuth = {
                "AuthProvider.useEffect.initializeAuth": async ()=>{
                    console.log('🚀 Initializing robust authentication...');
                    await validateAuth();
                }
            }["AuthProvider.useEffect.initializeAuth"];
            initializeAuth();
            // Listen for auth state changes from Supabase
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": async (event, session)=>{
                    if (!mounted.current) return;
                    console.log('🔑 Auth event:', event, !!session);
                    // Re-validate after any auth state change
                    setTimeout({
                        "AuthProvider.useEffect": ()=>validateAuth()
                    }["AuthProvider.useEffect"], 100);
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>{
                    mounted.current = false;
                    subscription.unsubscribe();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        validateAuth
    ]);
    // Proactive health monitoring
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if (!authState.session || !authState.isValid) {
                // Clear intervals if no valid session
                if (healthCheckInterval.current) clearInterval(healthCheckInterval.current);
                if (refreshCheckInterval.current) clearInterval(refreshCheckInterval.current);
                return;
            }
            // Health check every 5 minutes
            healthCheckInterval.current = setInterval({
                "AuthProvider.useEffect": async ()=>{
                    if (!mounted.current) return;
                    console.log('🏥 Running periodic health check...');
                    await validateAuth();
                }
            }["AuthProvider.useEffect"], 5 * 60 * 1000);
            // Refresh check every minute (check if token needs refresh)
            refreshCheckInterval.current = setInterval({
                "AuthProvider.useEffect": async ()=>{
                    if (!mounted.current || !authState.session) return;
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$auth$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTokenNearExpiry"])(authState.session)) {
                        console.log('🔄 Token near expiry, refreshing...');
                        await refreshSession();
                    }
                }
            }["AuthProvider.useEffect"], 60 * 1000);
            return ({
                "AuthProvider.useEffect": ()=>{
                    if (healthCheckInterval.current) clearInterval(healthCheckInterval.current);
                    if (refreshCheckInterval.current) clearInterval(refreshCheckInterval.current);
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        authState.session,
        authState.isValid,
        validateAuth,
        refreshSession
    ]);
    const isAuthenticated = authState.isValid && !!authState.user && !!authState.session;
    // Sign up with email/password
    const signUp = async (data)=>{
        try {
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            const { data: authData, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        display_name: data.displayName || '',
                        preferred_position: data.preferredPosition || '',
                        location: data.location || ''
                    }
                }
            });
            if (error) {
                console.error('Sign up error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
            // Validate the new auth state
            await validateAuth();
            return {
                success: true
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred'
            };
        }
    };
    // Sign in with email/password
    const signIn = async (data)=>{
        try {
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            const { data: authData, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email: data.email,
                password: data.password
            });
            if (error) {
                console.error('Sign in error:', error);
                setAuthState((prev)=>({
                        ...prev,
                        isLoading: false
                    }));
                // Return user-friendly error messages
                if (error.message.includes('Invalid login credentials')) {
                    return {
                        success: false,
                        error: 'Invalid email or password. Please try again.'
                    };
                }
                if (error.message.includes('Email not confirmed')) {
                    return {
                        success: false,
                        error: 'Please confirm your email before signing in.'
                    };
                }
                return {
                    success: false,
                    error: error.message
                };
            }
            // Validate the new auth state
            await validateAuth();
            return {
                success: true
            };
        } catch (error) {
            var _error_message;
            console.error('Sign in error:', error);
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: false
                }));
            // Handle network errors
            if (error === null || error === void 0 ? void 0 : (_error_message = error.message) === null || _error_message === void 0 ? void 0 : _error_message.includes('fetch')) {
                return {
                    success: false,
                    error: 'Network error. Please check your connection.'
                };
            }
            return {
                success: false,
                error: 'An unexpected error occurred. Please try again.'
            };
        } finally{
            // Ensure loading state is cleared
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: false
                }));
        }
    };
    // Sign in with OAuth
    const signInWithOAuth = async (provider)=>{
        try {
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: "".concat(window.location.origin, "/dashboard")
                }
            });
            if (error) {
                console.error('OAuth sign in error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('OAuth sign in error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred'
            };
        }
    };
    // Sign out
    const signOut = async ()=>{
        try {
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
            // Clear all auth state
            setAuthState({
                user: null,
                session: null,
                isValid: false,
                isLoading: false,
                lastValidated: null,
                validationStatus: 'signed_out'
            });
            // Clear cookies as well
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAuthCookies"])();
            return {
                success: true
            };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred'
            };
        }
    };
    // Reset password
    const resetPassword = async (email)=>{
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.resetPasswordForEmail(email, {
                redirectTo: "".concat(window.location.origin, "/auth/reset-password")
            });
            if (error) {
                console.error('Password reset error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred'
            };
        }
    };
    const value = {
        // State
        user: authState.user,
        session: authState.session,
        isLoading: authState.isLoading,
        isAuthenticated,
        isValid: authState.isValid,
        lastValidated: authState.lastValidated,
        // Actions
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        resetPassword,
        // Advanced
        validateAuth,
        refreshSession
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/player/src/components/auth/supabase-auth-provider.tsx",
        lineNumber: 372,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "vBYFIMnCgt9yEl2n245bY1r8HDc=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const getSession = async ()=>{
    try {
        const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
};
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/player/src/components/layout/header.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Professional Header Component
 * 
 * Main navigation header that makes amateur players feel like they're using
 * a professional sports platform. Includes MatchDay branding and key navigation.
 */ __turbopack_context__.s({
    "Header": ()=>Header
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/log-in.js [app-client] (ecmascript) <export default as LogIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$components$2f$auth$2f$supabase$2d$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/components/auth/supabase-auth-provider.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const Header = (param)=>{
    let { className = '' } = param;
    var _user_profile;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { user, isLoading, signOut, forceSignOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$components$2f$auth$2f$supabase$2d$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Debug logging for auth state
    console.log('🎨 Header render - Loading:', isLoading, 'User:', (user === null || user === void 0 ? void 0 : user.email) || 'null', 'Will show:', isLoading ? 'loading' : user ? 'logout button' : 'login button');
    const navItems = [
        {
            href: '/dashboard',
            label: 'My Dashboard',
            icon: '📊'
        },
        {
            href: '/leagues',
            label: 'Explore Leagues',
            icon: '🏆'
        },
        {
            href: '/teams',
            label: 'My Teams',
            icon: '👥'
        },
        {
            href: '/matches',
            label: 'Matches',
            icon: '⚽'
        },
        {
            href: '/profile',
            label: 'Profile Settings',
            icon: '⚙️'
        }
    ];
    const isActive = (href)=>{
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };
    const handleLogin = ()=>{
        router.push('/auth/login');
    };
    const handleLogout = async ()=>{
        try {
            console.log('🎨 Header: Starting logout...');
            const result = await signOut();
            if (result.success) {
                console.log('🎨 Header: Logout succeeded, redirecting...');
                // Only redirect if logout actually succeeded
                if ("TURBOPACK compile-time truthy", 1) {
                    window.location.href = '/';
                } else //TURBOPACK unreachable
                ;
            } else {
                console.error('🎨 Header: Logout failed:', result.error);
                // If logout failed due to network issues, offer force logout
                if (result.canForceLogout) {
                    const forceLogout = confirm("".concat(result.error, "\n\nWould you like to force logout? This will clear your local session but the server session may remain active."));
                    if (forceLogout) {
                        console.log('🎨 Header: User chose force logout');
                        const forceResult = await forceSignOut();
                        if (forceResult.success) {
                            console.log('🎨 Header: Force logout succeeded');
                            if (forceResult.error) {
                                // Show warning about potential server session
                                alert("Force logout completed. ".concat(forceResult.error));
                            }
                            window.location.href = '/';
                        } else {
                            alert("Force logout failed: ".concat(forceResult.error));
                        }
                    }
                } else {
                    // Regular error message for non-network issues
                    alert("Logout failed: ".concat(result.error));
                }
            }
        } catch (error) {
            console.error('🎨 Header: Logout exception:', error);
            alert('Logout failed due to unexpected error. Please try again.');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ".concat(className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between h-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "flex items-center space-x-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white font-bold text-sm",
                                    children: "M"
                                }, void 0, false, {
                                    fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 102,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                                children: "MatchDay"
                            }, void 0, false, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 105,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                        lineNumber: 101,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "hidden md:flex items-center space-x-1",
                        children: navItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ".concat(isActive(item.href) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-lg",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 122,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium",
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 123,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, item.href, true, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 113,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-4",
                        children: [
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"
                            }, void 0, false, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 132,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "hidden sm:flex items-center space-x-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                className: "w-5 h-5 text-gray-600 dark:text-gray-300"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                                lineNumber: 137,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-gray-700 dark:text-gray-300",
                                                children: ((_user_profile = user.profile) === null || _user_profile === void 0 ? void 0 : _user_profile.display_name) || user.email
                                            }, void 0, false, {
                                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                                lineNumber: 138,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 136,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleLogout,
                                        className: "flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                                lineNumber: 148,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "hidden sm:inline",
                                                children: "Logout"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                                lineNumber: 149,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 144,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 134,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleLogin,
                                className: "flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__["LogIn"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 157,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Login"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                        lineNumber: 158,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 153,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "md:hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-1",
                                    children: navItems.slice(1).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            className: "p-2 rounded-lg transition-colors ".concat(isActive(item.href) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xl",
                                                children: item.icon
                                            }, void 0, false, {
                                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                                lineNumber: 175,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, item.href, false, {
                                            fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                            lineNumber: 166,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                    lineNumber: 164,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/player/src/components/layout/header.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/player/src/components/layout/header.tsx",
                lineNumber: 99,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/apps/player/src/components/layout/header.tsx",
            lineNumber: 98,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/apps/player/src/components/layout/header.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Header, "cA4XZpqXKE11YDMFU2UnE8/BkRU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$components$2f$auth$2f$supabase$2d$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/player/src/components/providers/query-provider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * React Query Provider
 * 
 * Sets up React Query for the application to enable data fetching
 * and caching throughout the app.
 */ __turbopack_context__.s({
    "QueryProvider": ()=>QueryProvider
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@babel+core@7.28.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$90$2e$2$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.90.2/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$react$2d$query$40$5$2e$90$2e$2_react$40$19$2e$1$2e$0$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+react-query@5.90.2_react@19.1.0/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const QueryProvider = (param)=>{
    let { children } = param;
    _s();
    const [queryClient] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState({
        "QueryProvider.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$90$2e$2$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1
                    }
                }
            })
    }["QueryProvider.useState"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$babel$2b$core$40$7$2e$28$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$react$2d$query$40$5$2e$90$2e$2_react$40$19$2e$1$2e$0$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: children
    }, void 0, false, {
        fileName: "[project]/apps/player/src/components/providers/query-provider.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(QueryProvider, "ScbBLmOvXQNmDZkddhJWpgcJGqA=");
_c = QueryProvider;
var _c;
__turbopack_context__.k.register(_c, "QueryProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_44e8e88e._.js.map