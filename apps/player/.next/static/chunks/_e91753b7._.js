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
"[project]/packages/services/src/league.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * League Service for MatchDay
 * 
 * Handles league discovery and joining operations with focus on:
 * - League discovery and filtering (read-only, no league creation)
 * - Advanced search and compatibility matching
 * - Join request management for teams within leagues
 * - Player's league membership tracking
 * 
 * Optimized for player-centric amateur sports league experience
 */ __turbopack_context__.s({
    "LeagueService": ()=>LeagueService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class LeagueService {
    static getInstance(supabaseClient) {
        if (!LeagueService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            LeagueService.instance = new LeagueService(supabaseClient);
        }
        return LeagueService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("LeagueService.".concat(operation, ":"), {
            error,
            code: error === null || error === void 0 ? void 0 : error.code,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            type: typeof error,
            keys: Object.keys(error || {})
        });
        return {
            code: (error === null || error === void 0 ? void 0 : error.code) || 'UNKNOWN_ERROR',
            message: (error === null || error === void 0 ? void 0 : error.message) || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "league_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 600;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Discover available leagues with advanced filtering
   */ async discoverLeagues() {
        let filters = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('discoverLeagues', {
                filters,
                options: {
                    ...options,
                    userId: undefined
                }
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.userId) {
                return {
                    data: cached,
                    error: null,
                    success: true,
                    pagination: {
                        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                        limit: options.limit || 20,
                        total: cached.length,
                        totalPages: Math.ceil(cached.length / (options.limit || 20)),
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            // Build query with filters
            let query = this.supabase.from('leagues').select("\n          *,\n          teams (\n            id,\n            name,\n            team_color,\n            captain_id,\n            max_players,\n            min_players,\n            is_recruiting\n          )\n        ", {
                count: 'exact'
            }).eq('is_active', true).eq('is_public', true);
            if (filters.sportType) {
                query = query.eq('sport_type', filters.sportType);
            }
            if (filters.leagueType) {
                query = query.eq('league_type', filters.leagueType);
            }
            if (filters.location) {
                query = query.ilike('location', "%".concat(filters.location, "%"));
            }
            if (filters.entryFeeMax !== undefined) {
                query = query.lte('entry_fee', filters.entryFeeMax);
            }
            if (filters.seasonActive) {
                const now = new Date().toISOString();
                // Include leagues where season_end is null (ongoing/no end date) OR season_end is in the future
                query = query.or("season_end.gte.".concat(now, ",season_end.is.null"));
            }
            if (filters.search) {
                query = query.or("name.ilike.%".concat(filters.search, "%,description.ilike.%").concat(filters.search, "%"));
            }
            const { data: leagues, error, count } = await query.order('created_at', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            // Get user's current memberships if userId provided
            let userMemberships = [];
            if (options.userId) {
                const { data: memberships } = await this.supabase.from('team_members').select("\n            team:teams!inner(league_id)\n          ").eq('user_id', options.userId).eq('is_active', true);
                userMemberships = (memberships === null || memberships === void 0 ? void 0 : memberships.map((m)=>m.team.league_id)) || [];
            }
            // Process leagues into discovery format
            const discoveryLeagues = await Promise.all((leagues || []).map(async (league)=>{
                const teams = league.teams || [];
                const playerCount = await this.getLeaguePlayerCount(league.id);
                const availableSpots = await this.getLeagueAvailableSpots(league.id);
                let compatibilityScore;
                if (options.includeCompatibilityScore && options.userId) {
                    var _compatibility_data;
                    const compatibility = await this.calculateCompatibilityScore(league.id, options.userId);
                    compatibilityScore = (_compatibility_data = compatibility.data) === null || _compatibility_data === void 0 ? void 0 : _compatibility_data.score;
                }
                return {
                    ...league,
                    teams,
                    teamCount: teams.length,
                    playerCount: playerCount.data || 0,
                    availableSpots: availableSpots.data || 0,
                    isUserMember: userMemberships.includes(league.id),
                    compatibilityScore
                };
            }));
            // Sort by compatibility score if available
            if (options.includeCompatibilityScore) {
                discoveryLeagues.sort((a, b)=>(b.compatibilityScore || 0) - (a.compatibilityScore || 0));
            }
            // Cache results (without user-specific data)
            if (!options.userId) {
                this.setCache(cacheKey, discoveryLeagues, 600);
            }
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: discoveryLeagues,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'discoverLeagues'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Get detailed league information
   */ async getLeagueDetails(leagueId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            var _league_teams;
            console.log('LeagueService.getLeagueDetails - Starting:', {
                leagueId,
                options
            });
            const cacheKey = this.getCacheKey('getLeagueDetails', {
                leagueId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.userId) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Use API endpoint instead of direct Supabase query to avoid RLS issues
            let league;
            try {
                const response = await fetch("/api/leagues/".concat(leagueId));
                const result = await response.json();
                if (!response.ok || !result.success) {
                    if (response.status === 404) {
                        return {
                            data: null,
                            error: {
                                code: 'LEAGUE_NOT_FOUND',
                                message: 'League not found',
                                timestamp: new Date().toISOString()
                            },
                            success: false
                        };
                    }
                    throw new Error(result.error || "HTTP ".concat(response.status, ": ").concat(response.statusText));
                }
                league = result.data;
            } catch (error) {
                console.error('LeagueService.getLeagueDetails - API request error:', error);
                return {
                    data: null,
                    error: {
                        code: 'API_ERROR',
                        message: error instanceof Error ? error.message : 'Failed to fetch league details via API',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Process the league data to include statistics
            console.log('LeagueService.getLeagueDetails - Processing league:', {
                leagueId,
                hasTeams: !!league.teams,
                teamsCount: (_league_teams = league.teams) === null || _league_teams === void 0 ? void 0 : _league_teams.length
            });
            const teams = league.teams || [];
            const teamCount = teams.length;
            // Calculate total active players across all teams
            const playerCount = teams.reduce((total, team)=>{
                var _team_team_members;
                const activeMembers = ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((member)=>member.is_active)) || [];
                return total + activeMembers.length;
            }, 0);
            // Calculate available spots across all teams
            const availableSpots = teams.reduce((total, team)=>{
                var _team_team_members;
                const activeMembers = ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((member)=>member.is_active)) || [];
                const maxPlayers = team.max_players || 22;
                return total + Math.max(0, maxPlayers - activeMembers.length);
            }, 0);
            // Clean up team member data for response
            const processedTeams = teams.map((team)=>{
                var _team_team_members, _team_team_members1;
                return {
                    ...team,
                    currentPlayers: ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((member)=>member.is_active).length) || 0,
                    members: ((_team_team_members1 = team.team_members) === null || _team_team_members1 === void 0 ? void 0 : _team_team_members1.filter((member)=>member.is_active).map((member)=>({
                            id: member.id,
                            user_id: member.user_id,
                            position: member.position,
                            jersey_number: member.jersey_number,
                            joined_at: member.joined_at,
                            user_name: null,
                            user_email: null // User details not available in this query
                        }))) || []
                };
            });
            // Remove the raw team_members data
            processedTeams.forEach((team)=>delete team.team_members);
            // Check if user is member (if userId provided)
            let isUserMember = false;
            let joinRequests = [];
            if (options.userId && teams.length > 0) {
                // Check if user is a member of any team in this league
                const userTeams = teams.filter((team)=>{
                    var _team_team_members;
                    return (_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.some((member)=>member.user_id === options.userId && member.is_active);
                });
                isUserMember = userTeams.length > 0;
            }
            const leagueDiscovery = {
                ...league,
                teams: processedTeams,
                teamCount,
                playerCount,
                availableSpots,
                isUserMember,
                joinRequests: options.userId ? joinRequests : undefined,
                // Add derived stats
                isOpenForTeams: teamCount < (league.max_teams || 16),
                hasActiveTeams: teamCount > 0,
                averagePlayersPerTeam: teamCount > 0 ? Math.round(playerCount / teamCount * 10) / 10 : 0
            };
            // Cache if not user-specific
            if (!options.userId) {
                this.setCache(cacheKey, leagueDiscovery, 300);
            }
            return {
                data: leagueDiscovery,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getLeagueDetails'),
                success: false
            };
        }
    }
    /**
   * Calculate compatibility score between user and league
   */ async calculateCompatibilityScore(leagueId, userId) {
        try {
            const cacheKey = this.getCacheKey('calculateCompatibilityScore', {
                leagueId,
                userId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get league details
            const leagueResponse = await this.getLeagueDetails(leagueId);
            if (!leagueResponse.success || !leagueResponse.data) {
                throw new Error('League not found');
            }
            const league = leagueResponse.data;
            // Get user profile and stats
            const { data: userProfile, error: profileError } = await this.supabase.from('users').select('*').eq('id', userId).single();
            if (profileError) throw profileError;
            // Get user's cross-league stats
            const { data: userStats } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', new Date().getFullYear()).single();
            // Calculate compatibility factors
            const factors = {
                skillMatch: this.calculateSkillMatch(league, userStats),
                locationProximity: this.calculateLocationProximity(league, userProfile),
                scheduleCompatibility: this.calculateScheduleCompatibility(league),
                teamAvailability: this.calculateTeamAvailability(league),
                entryAffordability: this.calculateEntryAffordability(league, userProfile)
            };
            // Calculate overall score (weighted average)
            const weights = {
                skillMatch: 0.3,
                locationProximity: 0.2,
                scheduleCompatibility: 0.2,
                teamAvailability: 0.2,
                entryAffordability: 0.1
            };
            const score = Math.round(factors.skillMatch * weights.skillMatch + factors.locationProximity * weights.locationProximity + factors.scheduleCompatibility * weights.scheduleCompatibility + factors.teamAvailability * weights.teamAvailability + factors.entryAffordability * weights.entryAffordability);
            // Generate recommendations
            const recommendations = this.generateRecommendations(factors, league);
            const compatibility = {
                leagueId,
                score,
                factors,
                recommendations
            };
            // Cache for 30 minutes
            this.setCache(cacheKey, compatibility, 1800);
            return {
                data: compatibility,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculateCompatibilityScore'),
                success: false
            };
        }
    }
    /**
   * Get available teams in a league for joining
   */ async getAvailableTeams(leagueId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const { data: teams, error } = await this.supabase.from('teams').select("\n          *,\n          team_members!inner (\n            id,\n            user_id,\n            position,\n            is_active\n          )\n        ").eq('league_id', leagueId).eq('is_recruiting', true);
            if (error) throw error;
            // Get captain details
            const captainIds = (teams === null || teams === void 0 ? void 0 : teams.map((t)=>t.captain_id).filter(Boolean)) || [];
            const { data: captains } = captainIds.length > 0 ? await this.supabase.from('users').select('id, display_name').in('id', captainIds) : {
                data: []
            };
            const teamAvailabilities = (teams || []).map((team)=>{
                var _team_team_members;
                const activeMembers = ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((m)=>m.is_active)) || [];
                const captain = captains === null || captains === void 0 ? void 0 : captains.find((c)=>c.id === team.captain_id);
                // Calculate required positions (simplified - would need more complex logic)
                const requiredPositions = this.getRequiredPositions(team, activeMembers);
                return {
                    teamId: team.id,
                    teamName: team.name,
                    currentPlayers: activeMembers.length,
                    maxPlayers: team.max_players || 11,
                    availableSpots: Math.max(0, (team.max_players || 11) - activeMembers.length),
                    isRecruiting: team.is_recruiting,
                    requiredPositions,
                    captainContact: captain ? {
                        name: captain.display_name,
                        id: captain.id
                    } : undefined
                };
            });
            // Filter out full teams
            const availableTeams = teamAvailabilities.filter((team)=>team.availableSpots > 0);
            return {
                data: availableTeams,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAvailableTeams'),
                success: false
            };
        }
    }
    /**
   * Get player's league memberships
   */ async getPlayerLeagueMemberships(userId) {
        try {
            const cacheKey = this.getCacheKey('getPlayerLeagueMemberships', {
                userId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const { data: memberships, error } = await this.supabase.from('team_members').select("\n          *,\n          team:teams!inner (\n            *,\n            league:leagues!inner (*)\n          )\n        ").eq('user_id', userId).eq('is_active', true);
            if (error) throw error;
            // Process into league discovery format with membership details
            const leagueMemberships = await Promise.all((memberships || []).map(async (membership)=>{
                const league = membership.team.league;
                const playerCount = await this.getLeaguePlayerCount(league.id);
                const availableSpots = await this.getLeagueAvailableSpots(league.id);
                // Get all teams in the league
                const { data: allTeams } = await this.supabase.from('teams').select('*').eq('league_id', league.id);
                return {
                    ...league,
                    teams: allTeams || [],
                    teamCount: (allTeams === null || allTeams === void 0 ? void 0 : allTeams.length) || 0,
                    playerCount: playerCount.data || 0,
                    availableSpots: availableSpots.data || 0,
                    isUserMember: true,
                    teamMembership: {
                        teamId: membership.team_id,
                        teamName: membership.team.name,
                        position: membership.position,
                        jerseyNumber: membership.jersey_number,
                        joinedAt: membership.joined_at
                    }
                };
            }));
            // Cache for 5 minutes
            this.setCache(cacheKey, leagueMemberships, 300);
            return {
                data: leagueMemberships,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerLeagueMemberships'),
                success: false
            };
        }
    }
    /**
   * Private helper methods
   */ async getLeaguePlayerCount(leagueId) {
        try {
            // Get all teams in the league first
            const { data: teams, error: teamsError } = await this.supabase.from('teams').select('id').eq('league_id', leagueId);
            if (teamsError) throw teamsError;
            if (!teams || teams.length === 0) {
                return {
                    data: 0,
                    error: null,
                    success: true
                };
            }
            // Get count of active team members for those teams
            const { count, error } = await this.supabase.from('team_members').select('*', {
                count: 'exact',
                head: true
            }).eq('is_active', true).in('team_id', teams.map((t)=>t.id));
            if (error) throw error;
            return {
                data: count || 0,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: 0,
                error: this.handleError(error, 'getLeaguePlayerCount'),
                success: false
            };
        }
    }
    async getLeagueAvailableSpots(leagueId) {
        try {
            // Get all teams in the league with their member counts
            const { data: teams, error } = await this.supabase.from('teams').select("\n          id,\n          max_players,\n          team_members(id, is_active)\n        ").eq('league_id', leagueId);
            if (error) throw error;
            if (!teams || teams.length === 0) {
                return {
                    data: 0,
                    error: null,
                    success: true
                };
            }
            // Calculate available spots across all teams
            const availableSpots = teams.reduce((total, team)=>{
                var _team_team_members;
                const activeMembers = ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((member)=>member.is_active).length) || 0;
                const maxPlayers = team.max_players || 11;
                return total + Math.max(0, maxPlayers - activeMembers);
            }, 0);
            return {
                data: availableSpots,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: 0,
                error: this.handleError(error, 'getLeagueAvailableSpots'),
                success: false
            };
        }
    }
    calculateSkillMatch(league, userStats) {
        if (!userStats) return 50; // Neutral score for new players
        const avgGoalsPerGame = userStats.avg_goals_per_game || 0;
        const totalGames = userStats.total_games_played || 0;
        // Simple skill matching logic
        if (league.league_type === 'casual' && totalGames < 10) return 85;
        if (league.league_type === 'competitive' && avgGoalsPerGame > 0.5) return 80;
        if (league.league_type === 'friendly') return 75;
        return 60;
    }
    calculateLocationProximity(league, userProfile) {
        // Simplified location matching - would need geolocation in real implementation
        if (!league.location || !userProfile.location) return 50;
        const leagueLocation = league.location.toLowerCase();
        const userLocation = userProfile.location.toLowerCase();
        if (leagueLocation.includes(userLocation) || userLocation.includes(leagueLocation)) {
            return 90;
        }
        return 40;
    }
    calculateScheduleCompatibility(league) {
        const now = new Date();
        const seasonStart = new Date(league.season_start || now);
        const seasonEnd = new Date(league.season_end || now);
        // Check if season is upcoming or current
        if (seasonStart > now) return 85; // Upcoming season
        if (seasonEnd > now) return 70; // Current season
        return 30; // Past season
    }
    calculateTeamAvailability(league) {
        if (league.availableSpots === 0) return 0;
        if (league.availableSpots > 10) return 95;
        if (league.availableSpots > 5) return 80;
        return 60;
    }
    calculateEntryAffordability(league, userProfile) {
        const entryFee = league.entry_fee || 0;
        // Simplified affordability calculation
        if (entryFee === 0) return 100;
        if (entryFee < 50) return 85;
        if (entryFee < 100) return 70;
        return 50;
    }
    generateRecommendations(factors, league) {
        const recommendations = [];
        if (factors.skillMatch < 60) {
            recommendations.push('Consider improving your skills before joining this competitive league');
        }
        if (factors.locationProximity < 50) {
            recommendations.push('This league might be far from your location');
        }
        if (factors.teamAvailability < 50) {
            recommendations.push('Limited team spots available - apply soon');
        }
        if (factors.entryAffordability < 60) {
            recommendations.push('Entry fee might be higher than average');
        }
        return recommendations;
    }
    getRequiredPositions(team, activeMembers) {
        // Simplified position requirement logic
        const positions = [
            'Goalkeeper',
            'Defender',
            'Midfielder',
            'Forward'
        ];
        const occupiedPositions = activeMembers.map((m)=>m.position).filter(Boolean);
        return positions.filter((pos)=>!occupiedPositions.includes(pos));
    }
    /**
   * Subscribe to real-time league updates
   */ subscribeToLeagueUpdates(leagueId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'leagues',
            event: '*'
        };
        return this.supabase.channel("league-".concat(leagueId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "id=eq.".concat(leagueId)
        }, callback).subscribe();
    }
    /**
   * Clear cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(LeagueService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/team.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Team Service for MatchDay
 * 
 * Handles comprehensive team-related operations with focus on:
 * - Team creation and management
 * - Team member management and join requests
 * - Team statistics and performance tracking
 * - Real-time team updates and notifications
 * 
 * Optimized for amateur sports leagues with proper error handling,
 * caching strategies, and authentication integration.
 */ __turbopack_context__.s({
    "TeamService": ()=>TeamService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class TeamService {
    static getInstance(supabaseClient) {
        if (!TeamService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            TeamService.instance = new TeamService(supabaseClient);
        } else if (supabaseClient) {
            // Always update the supabase client to ensure fresh authentication context
            TeamService.instance.supabase = supabaseClient;
        }
        return TeamService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("TeamService.".concat(operation, ":"), error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "team_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Create a new team
   */ async createTeam(captainId, teamData) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            auto_add_creator: true
        };
        try {
            // First, validate that the league exists and is active
            const { data: league, error: leagueError } = await this.supabase.from('leagues').select('*').eq('id', teamData.league_id).eq('is_active', true).single();
            if (leagueError) {
                if (leagueError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'LEAGUE_NOT_FOUND',
                            message: 'Selected league not found or is not active',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw leagueError;
            }
            // Check if team name is unique within the league
            const { data: existingTeam, error: nameCheckError } = await this.supabase.from('teams').select('id').eq('league_id', teamData.league_id).eq('name', teamData.name).single();
            if (nameCheckError && nameCheckError.code !== 'PGRST116') {
                throw nameCheckError;
            }
            if (existingTeam) {
                return {
                    data: null,
                    error: {
                        code: 'TEAM_NAME_EXISTS',
                        message: 'A team with this name already exists in the selected league',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Use a transaction-like approach: create team without captain first, then add member, then update captain
            // This avoids the chicken-and-egg problem with foreign key constraints
            // Step 1: Create team record without captain initially
            const teamInsert = {
                league_id: teamData.league_id,
                name: teamData.name,
                team_color: teamData.team_color,
                captain_id: null,
                max_players: teamData.max_players || 22,
                min_players: teamData.min_players || 7,
                is_recruiting: true,
                team_bio: teamData.description || null
            };
            const { data: newTeam, error: teamError } = await this.supabase.from('teams').insert(teamInsert).select().single();
            if (teamError) throw teamError;
            try {
                // Step 2: Add creator as team member
                if (options.auto_add_creator) {
                    const { error: memberError } = await this.supabase.from('team_members').insert({
                        team_id: newTeam.id,
                        user_id: captainId,
                        position: options.initial_position || 'midfielder',
                        jersey_number: options.initial_jersey_number || 1,
                        is_active: true
                    });
                    if (memberError) throw memberError;
                }
                // Step 3: Update team with captain_id now that member exists
                const { error: updateError } = await this.supabase.from('teams').update({
                    captain_id: captainId
                }).eq('id', newTeam.id);
                if (updateError) throw updateError;
            } catch (error) {
                // If any step fails, clean up the team
                await this.supabase.from('teams').delete().eq('id', newTeam.id);
                throw error;
            }
            // Return the created team data directly without complex details lookup
            // to avoid potential infinite recursion during creation
            const basicTeamData = {
                ...newTeam,
                captain_id: captainId,
                league: null,
                captain: undefined,
                members: [],
                memberCount: options.auto_add_creator ? 1 : 0,
                availableSpots: (teamData.max_players || 22) - (options.auto_add_creator ? 1 : 0),
                isOrphaned: false,
                previousLeagueName: undefined
            };
            // Clear relevant caches
            this.clearCache('getUserTeams');
            return {
                data: basicTeamData,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'createTeam'),
                success: false
            };
        }
    }
    /**
   * Get season year for a team by checking their actual match dates
   */ async getTeamSeasonYear(teamId) {
        // Check if team has completed matches and get their season year
        const { data: matchYears } = await this.supabase.from('matches').select('match_date').or("home_team_id.eq.".concat(teamId, ",away_team_id.eq.").concat(teamId)).eq('status', 'completed').limit(1);
        if (matchYears && matchYears.length > 0) {
            const matchYear = new Date(matchYears[0].match_date).getFullYear();
            return matchYear;
        }
        // Fallback to current year if no completed matches
        return new Date().getFullYear();
    }
    /**
   * Get all leagues this team has participated in
   */ async getTeamLeagues(teamId) {
        try {
            // Get all leagues from team_stats (historical participation)
            const { data: leagueStats, error } = await this.supabase.from('team_stats').select("\n          league_id,\n          season_year,\n          leagues!inner(id, name)\n        ").eq('team_id', teamId);
            if (error) {
                console.error('Error fetching team leagues:', error);
                return [];
            }
            if (!leagueStats || leagueStats.length === 0) {
                return [];
            }
            // Group by league and collect seasons
            const leaguesMap = new Map();
            leagueStats.forEach((stat)=>{
                if (!stat.leagues) return;
                const leagueId = stat.leagues.id;
                if (!leaguesMap.has(leagueId)) {
                    leaguesMap.set(leagueId, {
                        id: leagueId,
                        name: stat.leagues.name,
                        seasons: [],
                        isCurrent: false
                    });
                }
                const league = leaguesMap.get(leagueId);
                if (!league.seasons.includes(stat.season_year)) {
                    league.seasons.push(stat.season_year);
                }
            });
            // Convert map to array and sort seasons
            const leagues = Array.from(leaguesMap.values());
            leagues.forEach((league)=>{
                league.seasons.sort((a, b)=>b - a); // Latest first
            // Mark as current if it's the team's current league
            // We'll determine this in the main method
            });
            return leagues.sort((a, b)=>a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error in getTeamLeagues:', error);
            return [];
        }
    }
    /**
   * Get detailed team information
   */ async getTeamDetails(teamId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            var _team_team_members;
            const cacheKey = this.getCacheKey('getTeamDetails', {
                teamId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.revalidateOnBackground) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get team with league and member details
            // Use left join for leagues since team might be orphaned
            const { data: team, error: teamError } = await this.supabase.from('teams').select("\n          *,\n          league:leagues(*),\n          team_members(\n            *,\n            user_profile:users(*)\n          )\n        ").eq('id', teamId).single();
            if (teamError) {
                if (teamError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'TEAM_NOT_FOUND',
                            message: 'Team not found',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw teamError;
            }
            // Get captain profile if exists
            let captain;
            if (team.captain_id) {
                const { data: captainProfile } = await this.supabase.from('users').select('*').eq('id', team.captain_id).single();
                captain = captainProfile || undefined;
            }
            // Get season year for this team
            const seasonYear = await this.getTeamSeasonYear(teamId);
            // Get all leagues this team has participated in
            const teamLeagues = await this.getTeamLeagues(teamId);
            // Get team statistics
            const { data: teamStats } = await this.supabase.from('team_stats').select('*').eq('team_id', teamId).eq('season_year', seasonYear).single();
            // Calculate team position if stats exist and team has a league
            let stats;
            if (teamStats && team.league_id) {
                const { data: leagueTeams } = await this.supabase.from('team_stats').select('team_id, points, goals_for, goals_against').eq('league_id', team.league_id).eq('season_year', seasonYear).order('points', {
                    ascending: false
                });
                const position = (leagueTeams === null || leagueTeams === void 0 ? void 0 : leagueTeams.findIndex((t)=>t.team_id === teamId)) + 1 || 1;
                stats = {
                    wins: teamStats.wins || 0,
                    draws: teamStats.draws || 0,
                    losses: teamStats.losses || 0,
                    goals: teamStats.goals_for || 0,
                    goalsAgainst: teamStats.goals_against || 0,
                    points: teamStats.points || 0,
                    position,
                    totalTeams: (leagueTeams === null || leagueTeams === void 0 ? void 0 : leagueTeams.length) || 1
                };
            } else if (teamStats) {
                // Team has stats but no league (orphaned team)
                stats = {
                    wins: teamStats.wins || 0,
                    draws: teamStats.draws || 0,
                    losses: teamStats.losses || 0,
                    goals: teamStats.goals_for || 0,
                    goalsAgainst: teamStats.goals_against || 0,
                    points: teamStats.points || 0,
                    position: 0,
                    totalTeams: 0
                };
            }
            // Mark current league in the leagues array
            const leagues = teamLeagues.map((league)=>({
                    ...league,
                    isCurrent: league.id === team.league_id
                }));
            const activeMembers = ((_team_team_members = team.team_members) === null || _team_team_members === void 0 ? void 0 : _team_team_members.filter((m)=>m.is_active)) || [];
            const teamWithDetails = {
                ...team,
                league: team.league || null,
                leagues: leagues,
                captain,
                members: activeMembers,
                memberCount: activeMembers.length,
                availableSpots: Math.max(0, (team.max_players || 22) - activeMembers.length),
                stats,
                isOrphaned: !team.league_id,
                previousLeagueName: team.previous_league_name || undefined
            };
            // Cache for 5 minutes, but clear existing cache to ensure fresh data
            this.clearCache('getTeamDetails');
            this.setCache(cacheKey, teamWithDetails, options.ttl || 300);
            return {
                data: teamWithDetails,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getTeamDetails'),
                success: false
            };
        }
    }
    /**
   * Get all teams for a user (where user is a member)
   */ async getUserTeams(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getUserTeams', {
                userId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            console.log('🔍 TeamService.getUserTeams - Querying for user:', userId);
            let memberQuery = this.supabase.from('team_members').select("\n          *,\n          team:teams!inner(\n            *,\n            league:leagues(*)\n          )\n        ").eq('user_id', userId);
            if (!options.includeInactive) {
                memberQuery = memberQuery.eq('is_active', true);
            }
            console.log('🔍 TeamService.getUserTeams - Executing query...');
            const { data: memberships, error: memberError } = await memberQuery.order('joined_at', {
                ascending: false
            }).limit(options.limit || 50);
            console.log('🔍 TeamService.getUserTeams - Query result:', {
                membershipsCount: (memberships === null || memberships === void 0 ? void 0 : memberships.length) || 0,
                error: (memberError === null || memberError === void 0 ? void 0 : memberError.message) || null,
                memberships: memberships
            });
            if (memberError) throw memberError;
            // PERFORMANCE OPTIMIZATION: Use embedded team data directly instead of expensive getTeamDetails calls
            console.log('🔍 TeamService.getUserTeams - Processing', (memberships === null || memberships === void 0 ? void 0 : memberships.length) || 0, 'memberships');
            console.log('🚀 OPTIMIZATION: Using embedded team data to eliminate N+1 query problem');
            const teams = (memberships || []).map((membership, index)=>{
                var _membership_team;
                console.log("🔍 TeamService.getUserTeams - Processing membership ".concat(index + 1, ":"), {
                    teamId: membership.team_id,
                    position: membership.position,
                    hasEmbeddedTeam: !!membership.team,
                    teamName: (_membership_team = membership.team) === null || _membership_team === void 0 ? void 0 : _membership_team.name
                });
                if (!membership.team) {
                    console.warn("⚠️ No embedded team data for membership ".concat(membership.team_id));
                    return null;
                }
                var _membership_team_is_active;
                // Create TeamWithDetails from embedded data - no additional queries needed
                const teamWithDetails = {
                    // Core team data (all available from the initial query)
                    id: membership.team.id,
                    name: membership.team.name,
                    description: membership.team.description || '',
                    team_color: membership.team.team_color,
                    max_players: membership.team.max_players || 22,
                    team_bio: membership.team.team_bio || '',
                    captain_id: membership.team.captain_id,
                    league_id: membership.team.league_id,
                    is_active: (_membership_team_is_active = membership.team.is_active) !== null && _membership_team_is_active !== void 0 ? _membership_team_is_active : true,
                    created_at: membership.team.created_at,
                    updated_at: membership.team.updated_at,
                    // League information (already included in query via join)
                    league: membership.team.league,
                    // Simplified member information for team listing (avoid expensive queries)
                    captain: null,
                    members: [],
                    memberCount: 1,
                    availableSpots: Math.max(0, (membership.team.max_players || 22) - 1),
                    // Status flags
                    isOrphaned: !membership.team.league_id,
                    // Skip expensive aggregations for team listing
                    stats: undefined,
                    joinRequests: undefined
                };
                console.log("✅ Created optimized team data for ".concat(membership.team.name, " (no additional queries)"));
                return teamWithDetails;
            });
            console.log('🔍 TeamService.getUserTeams - Team processing results:', {
                totalTeams: teams.length,
                validTeams: teams.filter((t)=>t !== null).length,
                nullTeams: teams.filter((t)=>t === null).length
            });
            const validTeams = teams.filter((team)=>team !== null);
            // Cache for 5 minutes
            this.setCache(cacheKey, validTeams, 300);
            console.log('🎯 TeamService.getUserTeams - Final result:', {
                success: true,
                teamsCount: validTeams.length,
                teamNames: validTeams.map((t)=>t.name)
            });
            return {
                data: validTeams,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getUserTeams'),
                success: false
            };
        }
    }
    /**
   * Update team information
   */ async updateTeam(teamId, captainId, updates) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase.from('teams').select('captain_id').eq('id', teamId).single();
            if (verifyError) throw verifyError;
            if (team.captain_id !== captainId) {
                return {
                    data: null,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Only team captains can update team information',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Update team
            const { data: updatedTeam, error: updateError } = await this.supabase.from('teams').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', teamId).select().single();
            if (updateError) throw updateError;
            // Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            return {
                data: updatedTeam,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'updateTeam'),
                success: false
            };
        }
    }
    /**
   * Find league by sport and location for team creation
   */ async findLeagueByName(sport, leagueName) {
        try {
            const { data: league, error } = await this.supabase.from('leagues').select('*').eq('sport_type', sport.toLowerCase()).eq('name', leagueName).eq('is_active', true).eq('is_public', true).single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'LEAGUE_NOT_FOUND',
                            message: 'No active league found with the specified name and sport',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw error;
            }
            return {
                data: league,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'findLeagueByName'),
                success: false
            };
        }
    }
    /**
   * Search teams across leagues
   */ async searchTeams() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        try {
            let query = this.supabase.from('teams').select("\n          *,\n          league:leagues!inner(*)\n        ", {
                count: 'exact'
            }).eq('league.is_active', true).eq('league.is_public', true);
            if (options.query) {
                query = query.or("name.ilike.%".concat(options.query, "%,team_bio.ilike.%").concat(options.query, "%"));
            }
            if (options.sport) {
                query = query.eq('league.sport_type', options.sport.toLowerCase());
            }
            if (options.location) {
                query = query.ilike('league.location', "%".concat(options.location, "%"));
            }
            if (options.hasAvailableSpots) {
                query = query.eq('is_recruiting', true);
            }
            const { data: teams, error, count } = await query.order('created_at', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            // Get detailed information for each team
            const teamPromises = (teams || []).map(async (team)=>{
                const teamDetails = await this.getTeamDetails(team.id);
                return teamDetails.data;
            });
            const detailedTeams = await Promise.all(teamPromises);
            const validTeams = detailedTeams.filter((team)=>team !== null);
            // Filter by available spots if requested
            const filteredTeams = options.hasAvailableSpots ? validTeams.filter((team)=>team.availableSpots > 0) : validTeams;
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: filteredTeams,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'searchTeams'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Subscribe to real-time team updates
   */ subscribeToTeamUpdates(teamId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'teams',
            event: '*'
        };
        return this.supabase.channel("team-".concat(teamId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "id=eq.".concat(teamId)
        }, callback).subscribe();
    }
    /**
   * Clear cache for specific operations or all cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    /**
   * Get all orphaned teams (teams without a league)
   */ async getOrphanedTeams() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        try {
            let query = this.supabase.from('teams').select("\n          *,\n          league:leagues(*),\n          team_members(\n            *,\n            user_profile:users(*)\n          )\n        ", {
                count: 'exact'
            }).is('league_id', null);
            if (!options.includeArchived) {
                query = query.eq('is_archived', false);
            }
            const { data: teams, error, count } = await query.order('updated_at', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            // Get detailed information for each team
            const teamPromises = (teams || []).map(async (team)=>{
                const teamDetails = await this.getTeamDetails(team.id);
                return teamDetails.data;
            });
            const detailedTeams = await Promise.all(teamPromises);
            const validTeams = detailedTeams.filter((team)=>team !== null);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: validTeams,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getOrphanedTeams'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Reassign an orphaned team to a new league
   */ async reassignTeamToLeague(teamId, newLeagueId, userId) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase.from('teams').select('captain_id, name, league_id').eq('id', teamId).single();
            if (verifyError) throw verifyError;
            if (team.captain_id !== userId) {
                return {
                    data: null,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Only team captains can reassign their team to a new league',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Verify the new league exists and is active
            const { data: league, error: leagueError } = await this.supabase.from('leagues').select('*').eq('id', newLeagueId).eq('is_active', true).single();
            if (leagueError) {
                if (leagueError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'LEAGUE_NOT_FOUND',
                            message: 'Selected league not found or is not active',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw leagueError;
            }
            // Check if team name is unique in the new league
            const { data: existingTeam, error: nameCheckError } = await this.supabase.from('teams').select('id').eq('league_id', newLeagueId).eq('name', team.name).neq('id', teamId).single();
            if (nameCheckError && nameCheckError.code !== 'PGRST116') {
                throw nameCheckError;
            }
            if (existingTeam) {
                return {
                    data: null,
                    error: {
                        code: 'TEAM_NAME_EXISTS',
                        message: 'A team with this name already exists in the selected league',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Update the team
            const { data: updatedTeam, error: updateError } = await this.supabase.from('teams').update({
                league_id: newLeagueId,
                previous_league_name: null,
                is_archived: false,
                updated_at: new Date().toISOString()
            }).eq('id', teamId).select().single();
            if (updateError) throw updateError;
            // Get the complete team details
            const teamDetails = await this.getTeamDetails(teamId);
            if (!teamDetails.success || !teamDetails.data) {
                throw new Error('Failed to retrieve updated team details');
            }
            // Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            this.clearCache('getOrphanedTeams');
            return {
                data: teamDetails.data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'reassignTeamToLeague'),
                success: false
            };
        }
    }
    /**
   * Archive an orphaned team
   */ async archiveTeam(teamId, userId) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase.from('teams').select('captain_id').eq('id', teamId).single();
            if (verifyError) throw verifyError;
            if (team.captain_id !== userId) {
                return {
                    data: null,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Only team captains can archive their team',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Archive the team
            const { data: archivedTeam, error: updateError } = await this.supabase.from('teams').update({
                is_archived: true,
                is_recruiting: false,
                updated_at: new Date().toISOString()
            }).eq('id', teamId).select().single();
            if (updateError) throw updateError;
            // Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            this.clearCache('getOrphanedTeams');
            return {
                data: archivedTeam,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'archiveTeam'),
                success: false
            };
        }
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(TeamService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/match.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Match Service for MatchDay
 * 
 * Handles match viewing and statistics operations with focus on:
 * - Player's upcoming and past matches
 * - Match events and statistics
 * - Live match tracking and real-time updates
 * - Performance metrics and match analysis
 * 
 * Optimized for player-centric match experience with comprehensive statistics
 */ __turbopack_context__.s({
    "MatchService": ()=>MatchService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class MatchService {
    static getInstance(supabaseClient) {
        if (!MatchService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            MatchService.instance = new MatchService(supabaseClient);
        }
        return MatchService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("MatchService.".concat(operation, ":"), error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "match_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Get player's matches with detailed information
   */ async getPlayerMatches(userId) {
        let filters = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        try {
            const cacheKey = this.getCacheKey('getPlayerMatches', {
                userId,
                filters,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true,
                    pagination: {
                        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                        limit: options.limit || 20,
                        total: cached.length,
                        totalPages: Math.ceil(cached.length / (options.limit || 20)),
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            // Get player's teams to find their matches
            const { data: userTeams, error: teamsError } = await this.supabase.from('team_members').select('team_id').eq('user_id', userId).eq('is_active', true);
            if (teamsError) throw teamsError;
            if (!userTeams || userTeams.length === 0) {
                return {
                    data: [],
                    error: null,
                    success: true,
                    pagination: {
                        page: 1,
                        limit: options.limit || 20,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            const teamIds = userTeams.map((tm)=>tm.team_id);
            // Build match query
            let query = this.supabase.from('matches').select("\n          *,\n          home_team:teams!matches_home_team_id_fkey(*),\n          away_team:teams!matches_away_team_id_fkey(*),\n          league:leagues!inner(*)\n        ", {
                count: 'exact'
            }).or("home_team_id.in.(".concat(teamIds.join(','), "),away_team_id.in.(").concat(teamIds.join(','), ")"));
            // Apply filters
            if (filters.leagueId) {
                query = query.eq('league_id', filters.leagueId);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.dateFrom) {
                query = query.gte('scheduled_date', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('scheduled_date', filters.dateTo);
            }
            if (filters.venue) {
                query = query.ilike('venue', "%".concat(filters.venue, "%"));
            }
            if (!options.includeFutureMatches) {
                query = query.lte('scheduled_date', new Date().toISOString());
            }
            const { data: matches, error, count } = await query.order('scheduled_date', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            // Get match events and stats for each match
            const matchesWithDetails = await Promise.all((matches || []).map(async (match)=>{
                // Get match events
                const { data: events, error: eventsError } = await this.supabase.from('match_events').select('*').eq('match_id', match.id).order('event_time', {
                    ascending: true
                });
                if (eventsError) throw eventsError;
                // Get team players
                const { data: homePlayers, error: homeError } = await this.supabase.from('team_members').select("\n              user_id,\n              position,\n              jersey_number,\n              users!inner(*)\n            ").eq('team_id', match.home_team_id).eq('is_active', true);
                const { data: awayPlayers, error: awayError } = await this.supabase.from('team_members').select("\n              user_id,\n              position,\n              jersey_number,\n              users!inner(*)\n            ").eq('team_id', match.away_team_id).eq('is_active', true);
                if (homeError) throw homeError;
                if (awayError) throw awayError;
                // Calculate player stats if requested
                let playerStats;
                if (options.includeStats) {
                    playerStats = await this.calculateMatchPlayerStats(match.id, userId);
                }
                return {
                    ...match,
                    homeTeam: match.home_team,
                    awayTeam: match.away_team,
                    league: match.league,
                    events: events || [],
                    homeTeamPlayers: (homePlayers || []).map((p)=>p.users),
                    awayTeamPlayers: (awayPlayers || []).map((p)=>p.users),
                    playerStats: playerStats ? [
                        playerStats
                    ] : undefined
                };
            }));
            // Cache for 2 minutes (shorter for live data)
            this.setCache(cacheKey, matchesWithDetails, 120);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: matchesWithDetails,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerMatches'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Get detailed match information
   */ async getMatchDetails(matchId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getMatchDetails', {
                matchId,
                includeAnalytics: options.includeAnalytics
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.userId) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get match with complete details
            const { data: match, error: matchError } = await this.supabase.from('matches').select("\n          *,\n          home_team:teams!matches_home_team_id_fkey(*),\n          away_team:teams!matches_away_team_id_fkey(*),\n          league:leagues!inner(*),\n          match_events(*)\n        ").eq('id', matchId).single();
            if (matchError) {
                if (matchError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'MATCH_NOT_FOUND',
                            message: 'Match not found',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw matchError;
            }
            // Get team players with profiles
            const [homePlayers, awayPlayers] = await Promise.all([
                this.supabase.from('team_members').select("\n            user_id,\n            position,\n            jersey_number,\n            users!inner(*)\n          ").eq('team_id', match.home_team_id).eq('is_active', true),
                this.supabase.from('team_members').select("\n            user_id,\n            position,\n            jersey_number,\n            users!inner(*)\n          ").eq('team_id', match.away_team_id).eq('is_active', true)
            ]);
            if (homePlayers.error) throw homePlayers.error;
            if (awayPlayers.error) throw awayPlayers.error;
            // Calculate player stats if userId provided
            let playerStats;
            if (options.userId) {
                playerStats = await this.calculateMatchPlayerStats(matchId, options.userId);
            }
            // Generate match analytics if requested
            let analytics;
            if (options.includeAnalytics) {
                analytics = await this.generateMatchAnalytics(matchId);
            }
            const matchWithDetails = {
                ...match,
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                league: match.league,
                events: match.match_events || [],
                homeTeamPlayers: (homePlayers.data || []).map((p)=>p.users),
                awayTeamPlayers: (awayPlayers.data || []).map((p)=>p.users),
                playerStats: playerStats ? [
                    playerStats
                ] : undefined
            };
            const result = {
                ...matchWithDetails,
                analytics: (analytics === null || analytics === void 0 ? void 0 : analytics.data) || undefined
            };
            // Cache if not user-specific
            if (!options.userId) {
                this.setCache(cacheKey, result, match.status === 'live' ? 30 : 600);
            }
            return {
                data: result,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchDetails'),
                success: false
            };
        }
    }
    /**
   * Get live match data with real-time updates
   */ async getLiveMatchData(matchId) {
        try {
            // Get match details first
            const matchResponse = await this.getMatchDetails(matchId, {
                includeAnalytics: true
            });
            if (!matchResponse.success || !matchResponse.data) {
                throw new Error('Match not found');
            }
            const match = matchResponse.data;
            // Get recent events (last 10 minutes)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const { data: recentEvents, error: eventsError } = await this.supabase.from('match_events').select('*').eq('match_id', matchId).gte('created_at', tenMinutesAgo.toISOString()).order('created_at', {
                ascending: false
            }).limit(10);
            if (eventsError) throw eventsError;
            // Calculate live stats
            const liveStats = await this.calculateLiveStats(matchId);
            const liveMatchData = {
                match,
                recentEvents: recentEvents || [],
                liveStats: liveStats.data || {
                    homeTeamStats: {},
                    awayTeamStats: {},
                    playerStats: {}
                }
            };
            return {
                data: liveMatchData,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getLiveMatchData'),
                success: false
            };
        }
    }
    /**
   * Get active/live matches
   */ async getActiveMatches() {
        let filters = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, limit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 50;
        try {
            const cacheKey = this.getCacheKey('getActiveMatches', {
                filters,
                limit
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            let query = this.supabase.from('active_matches').select('*').limit(limit);
            if (filters.leagueId) {
                query = query.eq('league_id', filters.leagueId);
            }
            if (filters.sportType) {
                query = query.eq('sport_type', filters.sportType);
            }
            const { data: activeMatches, error } = await query;
            if (error) throw error;
            // Cache for 1 minute (short cache for live data)
            this.setCache(cacheKey, activeMatches || [], 60);
            return {
                data: activeMatches || [],
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getActiveMatches'),
                success: false
            };
        }
    }
    /**
   * Get match predictions based on team and player statistics
   */ async getMatchPrediction(matchId) {
        try {
            const cacheKey = this.getCacheKey('getMatchPrediction', {
                matchId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get match details
            const matchResponse = await this.getMatchDetails(matchId);
            if (!matchResponse.success || !matchResponse.data) {
                throw new Error('Match not found');
            }
            const match = matchResponse.data;
            // Get team statistics
            const [homeTeamStats, awayTeamStats] = await Promise.all([
                this.supabase.from('team_stats').select('*').eq('team_id', match.homeTeam.id).eq('league_id', match.league_id).single(),
                this.supabase.from('team_stats').select('*').eq('team_id', match.awayTeam.id).eq('league_id', match.league_id).single()
            ]);
            // Calculate prediction probabilities using simple algorithm
            const prediction = this.calculateMatchPrediction(homeTeamStats.data, awayTeamStats.data, match);
            // Cache for 24 hours
            this.setCache(cacheKey, prediction, 86400);
            return {
                data: prediction,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchPrediction'),
                success: false
            };
        }
    }
    /**
   * Get player's performance metrics for a specific match
   */ async getPlayerMatchPerformance(matchId, playerId) {
        try {
            const cacheKey = this.getCacheKey('getPlayerMatchPerformance', {
                matchId,
                playerId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const playerStats = await this.calculateMatchPlayerStats(matchId, playerId);
            if (!playerStats) {
                return {
                    data: null,
                    error: {
                        code: 'PLAYER_NOT_IN_MATCH',
                        message: 'Player not found in this match',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Cache for 30 minutes
            this.setCache(cacheKey, playerStats, 1800);
            return {
                data: playerStats,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerMatchPerformance'),
                success: false
            };
        }
    }
    /**
   * Private helper methods
   */ async calculateMatchPlayerStats(matchId, playerId) {
        // Get player profile
        const { data: player, error: playerError } = await this.supabase.from('users').select('display_name').eq('id', playerId).single();
        if (playerError || !player) return null;
        // Get player's events in this match
        const { data: events, error: eventsError } = await this.supabase.from('match_events').select('*').eq('match_id', matchId).eq('player_id', playerId).order('event_time', {
            ascending: true
        });
        if (eventsError) return null;
        // Calculate stats from events
        const stats = (events || []).reduce((acc, event)=>{
            switch(event.event_type){
                case 'goal':
                    acc.goals++;
                    break;
                case 'assist':
                    acc.assists++;
                    break;
                case 'yellow_card':
                    acc.yellowCards++;
                    break;
                case 'red_card':
                    acc.redCards++;
                    break;
            }
            return acc;
        }, {
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0
        });
        // Calculate performance rating (simplified)
        const performance = {
            rating: Math.min(10, Math.max(1, 5 + stats.goals * 2 + stats.assists * 1.5 - stats.yellowCards * 0.5 - stats.redCards * 2)),
            keyPasses: 0,
            successfulPasses: 0,
            totalPasses: 0,
            tackles: 0,
            saves: undefined
        };
        return {
            matchId,
            playerId,
            playerName: player.display_name,
            goals: stats.goals,
            assists: stats.assists,
            yellowCards: stats.yellowCards,
            redCards: stats.redCards,
            minutesPlayed: 90,
            events: events || [],
            performance
        };
    }
    async calculateLiveStats(matchId) {
        try {
            // Get all match events
            const { data: events, error } = await this.supabase.from('match_events').select('*').eq('match_id', matchId);
            if (error) throw error;
            const homeTeamStats = {};
            const awayTeamStats = {};
            const playerStats = {};
            // Process events to calculate live stats
            (events || []).forEach((event)=>{
                // Team stats
                const isHomeTeam = event.team_id === 'home'; // This would need proper team ID checking
                const teamStats = isHomeTeam ? homeTeamStats : awayTeamStats;
                teamStats[event.event_type] = (teamStats[event.event_type] || 0) + 1;
                // Player stats
                if (event.player_id) {
                    if (!playerStats[event.player_id]) {
                        playerStats[event.player_id] = {};
                    }
                    playerStats[event.player_id][event.event_type] = (playerStats[event.player_id][event.event_type] || 0) + 1;
                }
            });
            return {
                data: {
                    homeTeamStats,
                    awayTeamStats,
                    playerStats
                },
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculateLiveStats'),
                success: false
            };
        }
    }
    async generateMatchAnalytics(matchId) {
        try {
            const { data: match, error: matchError } = await this.supabase.from('matches').select('*').eq('id', matchId).single();
            if (matchError) throw matchError;
            const { data: events, error: eventsError } = await this.supabase.from('match_events').select('*').eq('match_id', matchId).order('event_time', {
                ascending: true
            });
            if (eventsError) throw eventsError;
            // Calculate analytics
            const analytics = {
                matchId,
                duration: match.match_duration || 90,
                totalEvents: (events === null || events === void 0 ? void 0 : events.length) || 0,
                goalsByPeriod: this.calculateGoalsByPeriod(events || []),
                cardsByTeam: this.calculateCardsByTeam(events || []),
                topPerformers: {
                    home: [],
                    away: []
                },
                matchMomentum: this.calculateMatchMomentum(events || [])
            };
            return {
                data: analytics,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'generateMatchAnalytics'),
                success: false
            };
        }
    }
    calculateMatchPrediction(homeStats, awayStats, match) {
        // Simplified prediction algorithm
        const homeForm = homeStats ? (homeStats.wins || 0) / Math.max(homeStats.games_played || 1, 1) : 0.5;
        const awayForm = awayStats ? (awayStats.wins || 0) / Math.max(awayStats.games_played || 1, 1) : 0.5;
        const homeAttack = homeStats ? (homeStats.goals_for || 0) / Math.max(homeStats.games_played || 1, 1) : 1;
        const awayAttack = awayStats ? (awayStats.goals_for || 0) / Math.max(awayStats.games_played || 1, 1) : 1;
        // Simple probability calculation
        const totalStrength = homeForm + awayForm + 0.1; // Add small constant to avoid division by zero
        const homeWinProbability = Math.round((homeForm + 0.1) / totalStrength * 100);
        const awayWinProbability = Math.round((awayForm + 0.1) / totalStrength * 100);
        const drawProbability = 100 - homeWinProbability - awayWinProbability;
        return {
            matchId: match.id,
            homeWinProbability,
            drawProbability,
            awayWinProbability,
            expectedGoalsHome: Number(homeAttack.toFixed(1)),
            expectedGoalsAway: Number(awayAttack.toFixed(1)),
            keyFactors: [
                "".concat(match.homeTeam.name, " home advantage"),
                "Recent form comparison",
                "Head-to-head record"
            ],
            confidence: 75
        };
    }
    calculateGoalsByPeriod(events) {
        return events.reduce((acc, event)=>{
            if (event.event_type === 'goal' && event.event_time !== null) {
                if (event.event_time <= 45) {
                    // Would need team determination logic
                    acc.firstHalf.home++;
                } else if (event.event_time <= 90) {
                    acc.secondHalf.home++;
                }
            }
            return acc;
        }, {
            firstHalf: {
                home: 0,
                away: 0
            },
            secondHalf: {
                home: 0,
                away: 0
            }
        });
    }
    calculateCardsByTeam(events) {
        return {
            home: {
                yellow: 0,
                red: 0
            },
            away: {
                yellow: 0,
                red: 0
            }
        };
    }
    calculateMatchMomentum(events) {
        return events.map((event, index)=>({
                minute: event.event_time || 0,
                homeScore: 0,
                awayScore: 0,
                eventType: event.event_type,
                momentum: 0 // Would need momentum calculation algorithm
            }));
    }
    /**
   * Subscribe to real-time match updates
   */ subscribeToMatchUpdates(matchId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'match_events',
            event: '*'
        };
        return this.supabase.channel("match-".concat(matchId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "match_id=eq.".concat(matchId)
        }, callback).subscribe();
    }
    /**
   * Create a new match between two teams
   */ async createMatch(data) {
        try {
            console.log('🏟️ MatchService.createMatch:', data);
            // Validate teams exist and are different
            const { data: teams, error: teamsError } = await this.supabase.from('teams').select('id, name').in('id', [
                data.homeTeamId,
                data.awayTeamId
            ]);
            if (teamsError) throw teamsError;
            if (!teams || teams.length !== 2) {
                return {
                    data: null,
                    error: {
                        code: 'INVALID_TEAMS',
                        message: 'One or both teams do not exist',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // Create the match
            const { data: match, error: matchError } = await this.supabase.from('matches').insert({
                home_team_id: data.homeTeamId,
                away_team_id: data.awayTeamId,
                match_date: data.matchDate,
                scheduled_date: data.matchDate,
                venue: data.venue || 'TBD',
                league_id: data.leagueId || null,
                match_type: data.matchType || 'friendly',
                status: 'scheduled'
            }).select("\n          *,\n          home_team:teams!matches_home_team_id_fkey(*),\n          away_team:teams!matches_away_team_id_fkey(*),\n          league:leagues(*)\n        ").single();
            if (matchError) throw matchError;
            // Clear cache
            this.clearCache('getPlayerMatches');
            this.clearCache('getActiveMatches');
            return {
                data: match,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'createMatch'),
                success: false
            };
        }
    }
    /**
   * Update match score and status
   */ async updateMatchScore(matchId, data) {
        try {
            console.log('⚽ MatchService.updateMatchScore:', matchId, data);
            const updateData = {
                home_score: data.homeScore,
                away_score: data.awayScore,
                updated_at: new Date().toISOString()
            };
            if (data.status) {
                updateData.status = data.status;
            }
            if (data.duration !== undefined) {
                updateData.match_duration = data.duration;
            }
            if (data.notes !== undefined) {
                updateData.notes = data.notes;
            }
            const { data: match, error: updateError } = await this.supabase.from('matches').update(updateData).eq('id', matchId).select("\n          *,\n          home_team:teams!matches_home_team_id_fkey(*),\n          away_team:teams!matches_away_team_id_fkey(*),\n          league:leagues(*)\n        ").single();
            if (updateError) throw updateError;
            // Clear cache
            this.clearCache('getPlayerMatches');
            this.clearCache('getMatchDetails');
            this.clearCache('getActiveMatches');
            return {
                data: match,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'updateMatchScore'),
                success: false
            };
        }
    }
    /**
   * Get match participants
   */ async getMatchParticipants(matchId) {
        try {
            console.log('👥 MatchService.getMatchParticipants:', matchId);
            const cacheKey = this.getCacheKey('getMatchParticipants', {
                matchId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get match details
            const { data: match, error: matchError } = await this.supabase.from('matches').select("\n          id,\n          home_team_id,\n          away_team_id,\n          home_team:teams!matches_home_team_id_fkey(id, name, team_color),\n          away_team:teams!matches_away_team_id_fkey(id, name, team_color)\n        ").eq('id', matchId).single();
            if (matchError) throw matchError;
            // Get participants
            const { data: participants, error: participantsError } = await this.supabase.from('match_participants').select("\n          *,\n          user:user_profiles(id, display_name, full_name, avatar_url, preferred_position)\n        ").eq('match_id', matchId).order('jersey_number', {
                ascending: true
            });
            if (participantsError) throw participantsError;
            // Group by team
            const homeParticipants = (participants === null || participants === void 0 ? void 0 : participants.filter((p)=>p.team_id === match.home_team_id)) || [];
            const awayParticipants = (participants === null || participants === void 0 ? void 0 : participants.filter((p)=>p.team_id === match.away_team_id)) || [];
            const result = {
                homeTeam: {
                    ...match.home_team,
                    participants: homeParticipants.map((p)=>({
                            id: p.id,
                            userId: p.user_id,
                            position: p.position,
                            jerseyNumber: p.jersey_number,
                            isStarter: p.is_starter,
                            isCaptain: p.is_captain,
                            selectedAt: p.selected_at,
                            player: p.user
                        }))
                },
                awayTeam: {
                    ...match.away_team,
                    participants: awayParticipants.map((p)=>({
                            id: p.id,
                            userId: p.user_id,
                            position: p.position,
                            jerseyNumber: p.jersey_number,
                            isStarter: p.is_starter,
                            isCaptain: p.is_captain,
                            selectedAt: p.selected_at,
                            player: p.user
                        }))
                }
            };
            // Cache for 5 minutes
            this.setCache(cacheKey, result, 300);
            return {
                data: result,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchParticipants'),
                success: false
            };
        }
    }
    /**
   * Add participant to match
   */ async addMatchParticipant(data) {
        try {
            console.log('➕ MatchService.addMatchParticipant:', data);
            const { data: participant, error } = await this.supabase.from('match_participants').upsert({
                match_id: data.matchId,
                team_id: data.teamId,
                user_id: data.userId,
                position: data.position || null,
                jersey_number: data.jerseyNumber || null,
                is_starter: data.isStarter || false,
                is_captain: data.isCaptain || false
            }, {
                onConflict: 'match_id,user_id'
            }).select("\n          *,\n          user:user_profiles(id, display_name, full_name)\n        ").single();
            if (error) throw error;
            // Clear cache
            this.clearCache('getMatchParticipants');
            return {
                data: participant,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'addMatchParticipant'),
                success: false
            };
        }
    }
    /**
   * Remove participant from match
   */ async removeMatchParticipant(participantId) {
        try {
            console.log('🗑️ MatchService.removeMatchParticipant:', participantId);
            const { error } = await this.supabase.from('match_participants').delete().eq('id', participantId);
            if (error) throw error;
            // Clear cache
            this.clearCache('getMatchParticipants');
            return {
                data: null,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'removeMatchParticipant'),
                success: false
            };
        }
    }
    /**
   * Clear cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(MatchService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/season.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Season Service for MatchDay
 * 
 * Handles season management operations including:
 * - Season creation and management
 * - Team registration for seasons
 * - Match scheduling and fixture generation
 * - Season statistics and standings
 */ __turbopack_context__.s({
    "SeasonService": ()=>SeasonService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class SeasonService {
    static getInstance(supabaseClient) {
        if (!SeasonService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            SeasonService.instance = new SeasonService(supabaseClient);
        }
        return SeasonService.instance;
    }
    /**
   * Get all seasons for a league
   */ async getSeasonsByLeague(leagueId) {
        try {
            const { data: seasons, error } = await this.supabase.from('seasons').select('*').eq('league_id', leagueId).order('season_year', {
                ascending: false
            });
            if (error) throw error;
            return {
                data: seasons || [],
                error: null,
                success: true,
                message: 'Seasons retrieved successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to get seasons'
            };
        }
    }
    /**
   * Get season details with teams
   */ async getSeasonDetails(seasonId) {
        try {
            const { data: season, error } = await this.supabase.from('seasons').select("\n          *,\n          season_teams (\n            id,\n            team_id,\n            registration_date,\n            status,\n            team:teams (\n              id,\n              name,\n              team_color,\n              captain_id\n            )\n          )\n        ").eq('id', seasonId).single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'SEASON_NOT_FOUND',
                            message: 'Season not found'
                        },
                        success: false
                    };
                }
                throw error;
            }
            return {
                data: {
                    ...season,
                    teams: season.season_teams || []
                },
                error: null,
                success: true,
                message: 'Season details retrieved successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to get season details'
            };
        }
    }
    /**
   * Create a new season
   */ async createSeason(seasonData) {
        try {
            const { data: season, error } = await this.supabase.from('seasons').insert([
                {
                    name: seasonData.name,
                    league_id: seasonData.league_id,
                    season_year: seasonData.season_year || new Date().getFullYear(),
                    display_name: seasonData.display_name || seasonData.name,
                    status: seasonData.status || 'draft',
                    tournament_format: seasonData.tournament_format || 'league',
                    start_date: seasonData.start_date,
                    end_date: seasonData.end_date,
                    registration_deadline: seasonData.registration_deadline,
                    match_frequency: seasonData.match_frequency || 7,
                    preferred_match_time: seasonData.preferred_match_time || '15:00:00',
                    min_teams: seasonData.min_teams || 2,
                    max_teams: seasonData.max_teams,
                    rounds: seasonData.rounds || 1,
                    points_for_win: seasonData.points_for_win || 3,
                    points_for_draw: seasonData.points_for_draw || 1,
                    points_for_loss: seasonData.points_for_loss || 0,
                    allow_draws: seasonData.allow_draws !== false,
                    home_away_balance: seasonData.home_away_balance !== false,
                    rules: seasonData.rules || {},
                    settings: seasonData.settings || {},
                    metadata: seasonData.metadata || {}
                }
            ]).select().single();
            if (error) throw error;
            return {
                data: season,
                error: null,
                success: true,
                message: 'Season created successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to create season'
            };
        }
    }
    /**
   * Update season
   */ async updateSeason(seasonId, updates) {
        try {
            const { data: season, error } = await this.supabase.from('seasons').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', seasonId).select().single();
            if (error) throw error;
            return {
                data: season,
                error: null,
                success: true,
                message: 'Season updated successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to update season'
            };
        }
    }
    /**
   * Register team for season
   */ async registerTeamForSeason(seasonId, teamId) {
        try {
            // Check if team is already registered
            const { data: existing, error: checkError } = await this.supabase.from('season_teams').select('id').eq('season_id', seasonId).eq('team_id', teamId).single();
            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existing) {
                return {
                    data: null,
                    error: {
                        code: 'ALREADY_REGISTERED',
                        message: 'Team is already registered for this season'
                    },
                    success: false
                };
            }
            // Register the team
            const { data: registration, error } = await this.supabase.from('season_teams').insert([
                {
                    season_id: seasonId,
                    team_id: teamId,
                    registration_date: new Date().toISOString(),
                    status: 'registered'
                }
            ]).select("\n          *,\n          team:teams (\n            id,\n            name,\n            team_color,\n            captain_id\n          )\n        ").single();
            if (error) throw error;
            // Update registered teams count
            await this.updateRegisteredTeamsCount(seasonId);
            return {
                data: registration,
                error: null,
                success: true,
                message: 'Team registered for season successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to register team for season'
            };
        }
    }
    /**
   * Generate round-robin fixtures for a season
   */ async generateFixtures(seasonId) {
        try {
            var _season_teams;
            // Get season details
            const seasonResponse = await this.getSeasonDetails(seasonId);
            if (!seasonResponse.success || !seasonResponse.data) {
                throw new Error('Season not found');
            }
            const season = seasonResponse.data;
            const teams = ((_season_teams = season.teams) === null || _season_teams === void 0 ? void 0 : _season_teams.filter((t)=>t.status === 'registered' || t.status === 'confirmed')) || [];
            if (teams.length < 2) {
                return {
                    data: null,
                    error: {
                        code: 'INSUFFICIENT_TEAMS',
                        message: 'Need at least 2 teams to generate fixtures'
                    },
                    success: false
                };
            }
            // Update fixtures status to generating
            await this.updateSeason(seasonId, {
                fixtures_status: 'generating',
                total_matches_planned: this.calculateTotalMatches(teams.length, season.rounds || 1, season.home_away_balance || false)
            });
            // Generate round-robin fixtures
            const fixtures = this.generateRoundRobinFixtures(teams, season.rounds || 1, season.home_away_balance || false);
            // Calculate match dates based on season start date and frequency
            const fixturesWithDates = this.assignMatchDates(fixtures, season);
            // Clear existing fixtures for this season
            await this.supabase.from('matches').delete().eq('season_id', seasonId);
            // Insert new fixtures
            const { data: matches, error } = await this.supabase.from('matches').insert(fixturesWithDates.map((fixture)=>({
                    season_id: seasonId,
                    home_team_id: fixture.home_team_id,
                    away_team_id: fixture.away_team_id,
                    match_date: fixture.match_date,
                    status: 'scheduled'
                }))).select("\n          *,\n          home_team:teams!matches_home_team_id_fkey (\n            id,\n            name,\n            team_color\n          ),\n          away_team:teams!matches_away_team_id_fkey (\n            id,\n            name,\n            team_color\n          )\n        ");
            if (error) throw error;
            // Update fixtures status to completed
            await this.updateSeason(seasonId, {
                fixtures_status: 'completed',
                fixtures_generated_at: new Date().toISOString()
            });
            return {
                data: matches || [],
                error: null,
                success: true,
                message: 'Fixtures generated successfully'
            };
        } catch (error) {
            // Update fixtures status to error
            await this.updateSeason(seasonId, {
                fixtures_status: 'error',
                fixtures_generation_error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to generate fixtures'
            };
        }
    }
    /**
   * Get matches for a season
   */ async getSeasonMatches(seasonId) {
        try {
            const { data: matches, error } = await this.supabase.from('matches').select("\n          *,\n          home_team:teams!matches_home_team_id_fkey (\n            id,\n            name,\n            team_color\n          ),\n          away_team:teams!matches_away_team_id_fkey (\n            id,\n            name,\n            team_color\n          )\n        ").eq('season_id', seasonId).order('match_date', {
                ascending: true
            });
            if (error) throw error;
            return {
                data: matches || [],
                error: null,
                success: true,
                message: 'Season matches retrieved successfully'
            };
        } catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to get season matches'
            };
        }
    }
    /**
   * Private helper methods
   */ async updateRegisteredTeamsCount(seasonId) {
        const { count } = await this.supabase.from('season_teams').select('*', {
            count: 'exact',
            head: true
        }).eq('season_id', seasonId).in('status', [
            'registered',
            'confirmed'
        ]);
        await this.supabase.from('seasons').update({
            registered_teams_count: count || 0
        }).eq('id', seasonId);
    }
    calculateTotalMatches(teamsCount, rounds, homeAndAway) {
        const matchesPerRound = teamsCount * (teamsCount - 1) / 2;
        const multiplier = homeAndAway ? 2 : 1;
        return matchesPerRound * rounds * multiplier;
    }
    generateRoundRobinFixtures(teams, rounds, homeAndAway) {
        const fixtures = [];
        for(let round = 1; round <= rounds; round++){
            // Generate all possible pairings
            for(let i = 0; i < teams.length; i++){
                for(let j = i + 1; j < teams.length; j++){
                    fixtures.push({
                        home_team_id: teams[i].team_id,
                        away_team_id: teams[j].team_id,
                        round_number: round
                    });
                    // Add reverse fixture if home and away
                    if (homeAndAway) {
                        fixtures.push({
                            home_team_id: teams[j].team_id,
                            away_team_id: teams[i].team_id,
                            round_number: round
                        });
                    }
                }
            }
        }
        return fixtures;
    }
    assignMatchDates(fixtures, season) {
        const startDate = new Date(season.start_date);
        const matchFrequencyDays = season.match_frequency || 7;
        const preferredTime = season.preferred_match_time || '15:00:00';
        return fixtures.map((fixture, index)=>{
            const dayOffset = Math.floor(index / 2) * matchFrequencyDays; // 2 matches per day
            const matchDate = new Date(startDate);
            matchDate.setDate(matchDate.getDate() + dayOffset);
            return {
                ...fixture,
                match_date: "".concat(matchDate.toISOString().split('T')[0], "T").concat(preferredTime, "Z")
            };
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(SeasonService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/player.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Enhanced Player Service for MatchDay
 * 
 * Handles comprehensive player-related operations with focus on:
 * - Player profiles and cross-league statistics
 * - Achievement tracking and progress
 * - Performance analytics and rankings
 * - Team memberships and join requests
 * 
 * Optimized for amateur sports leagues with proper error handling,
 * caching strategies, and real-time updates.
 */ __turbopack_context__.s({
    "PlayerService": ()=>PlayerService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class PlayerService {
    static getInstance(supabaseClient) {
        if (!PlayerService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            PlayerService.instance = new PlayerService(supabaseClient);
        }
        return PlayerService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("PlayerService.".concat(operation, ":"), error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "player_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Get comprehensive player profile with all related data
   */ async getPlayerProfile(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getPlayerProfile', {
                userId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.revalidateOnBackground) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get basic profile
            const { data: profile, error: profileError } = await this.supabase.from('users').select('*').eq('id', userId).single();
            if (profileError) {
                if (profileError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: {
                            code: 'PLAYER_NOT_FOUND',
                            message: 'Player not found',
                            timestamp: new Date().toISOString()
                        },
                        success: false
                    };
                }
                throw profileError;
            }
            // Get team memberships with league details
            const { data: teamMemberships, error: teamsError } = await this.supabase.from('team_members').select("\n          *,\n          team:teams!inner(\n            *,\n            league:leagues!inner(*)\n          )\n        ").eq('user_id', userId).eq('is_active', true);
            if (teamsError) throw teamsError;
            // Get achievements
            const { data: userAchievements, error: achievementsError } = await this.supabase.from('user_achievements').select("\n          *,\n          achievement:achievements!inner(*)\n        ").eq('user_id', userId).order('earned_at', {
                ascending: false
            });
            if (achievementsError) throw achievementsError;
            // Get cross-league stats
            const { data: crossLeagueStats, error: crossStatsError } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', new Date().getFullYear()).single();
            // Don't throw error if no cross-league stats exist
            if (crossStatsError && crossStatsError.code !== 'PGRST116') {
                throw crossStatsError;
            }
            // Get global rankings
            const globalRankings = await this.getPlayerGlobalRankings(userId);
            const playerProfile = {
                ...profile,
                teams: (teamMemberships === null || teamMemberships === void 0 ? void 0 : teamMemberships.map((tm)=>({
                        team: tm.team,
                        membership: tm
                    }))) || [],
                achievements: (userAchievements === null || userAchievements === void 0 ? void 0 : userAchievements.map((ua)=>({
                        achievement: ua.achievement,
                        userAchievement: ua
                    }))) || [],
                crossLeagueStats: crossLeagueStats || null,
                globalRankings: globalRankings.data || {
                    goals: null,
                    assists: null,
                    matches: null
                }
            };
            // Cache the result
            this.setCache(cacheKey, playerProfile, options.ttl || 300);
            return {
                data: playerProfile,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerProfile'),
                success: false
            };
        }
    }
    /**
   * Update player profile information
   */ async updatePlayerProfile(userId, updates) {
        try {
            const { data, error } = await this.supabase.from('users').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', userId).select().single();
            if (error) throw error;
            // Invalidate cache
            const cacheKey = this.getCacheKey('getPlayerProfile', {
                userId
            });
            this.cache.delete(cacheKey);
            return {
                data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'updatePlayerProfile'),
                success: false
            };
        }
    }
    /**
   * Get player's cross-league statistics aggregation
   */ async getCrossLeagueStats(userId, seasonYear) {
        try {
            const year = seasonYear || new Date().getFullYear();
            const cacheKey = this.getCacheKey('getCrossLeagueStats', {
                userId,
                year
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const { data, error } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', year).single();
            if (error && error.code !== 'PGRST116') throw error;
            // Cache for 10 minutes
            this.setCache(cacheKey, data, 600);
            return {
                data: data || null,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getCrossLeagueStats'),
                success: false
            };
        }
    }
    /**
   * Get player's global rankings across different stats
   */ async getPlayerGlobalRankings(userId) {
        try {
            const cacheKey = this.getCacheKey('getPlayerGlobalRankings', {
                userId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get rankings for different stats using stored procedures
            const [goalsRank, assistsRank, matchesRank] = await Promise.allSettled([
                this.supabase.rpc('get_player_global_rank', {
                    player_id: userId,
                    stat_column: 'total_goals'
                }),
                this.supabase.rpc('get_player_global_rank', {
                    player_id: userId,
                    stat_column: 'total_assists'
                }),
                this.supabase.rpc('get_player_global_rank', {
                    player_id: userId,
                    stat_column: 'total_games_played'
                })
            ]);
            const rankings = {
                goals: goalsRank.status === 'fulfilled' && goalsRank.value.data ? {
                    rank: goalsRank.value.data.rank,
                    total: goalsRank.value.data.total_players,
                    percentile: Math.round((1 - goalsRank.value.data.rank / goalsRank.value.data.total_players) * 100)
                } : null,
                assists: assistsRank.status === 'fulfilled' && assistsRank.value.data ? {
                    rank: assistsRank.value.data.rank,
                    total: assistsRank.value.data.total_players,
                    percentile: Math.round((1 - assistsRank.value.data.rank / assistsRank.value.data.total_players) * 100)
                } : null,
                matches: matchesRank.status === 'fulfilled' && matchesRank.value.data ? {
                    rank: matchesRank.value.data.rank,
                    total: matchesRank.value.data.total_players,
                    percentile: Math.round((1 - matchesRank.value.data.rank / matchesRank.value.data.total_players) * 100)
                } : null
            };
            // Cache for 30 minutes
            this.setCache(cacheKey, rankings, 1800);
            return {
                data: rankings,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerGlobalRankings'),
                success: false
            };
        }
    }
    /**
   * Get player's achievements with progress tracking
   */ async getPlayerAchievements(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            let query = this.supabase.from('achievements').select("\n          *,\n          user_achievements!left(*)\n        ").eq('is_active', true);
            if (options.category) {
                query = query.eq('category', options.category);
            }
            if (options.completed !== undefined) {
                if (options.completed) {
                    query = query.not('user_achievements', 'is', null);
                } else {
                    query = query.is('user_achievements', null);
                }
            }
            const { data: achievements, error, count } = await query.order('sort_order').range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);
            if (error) throw error;
            // Get current player stats for progress calculation
            const playerStats = await this.getCrossLeagueStats(userId);
            const stats = playerStats.data;
            const achievementData = (achievements === null || achievements === void 0 ? void 0 : achievements.map((achievement)=>{
                var _achievement_user_achievements;
                const userAchievement = (_achievement_user_achievements = achievement.user_achievements) === null || _achievement_user_achievements === void 0 ? void 0 : _achievement_user_achievements.find((ua)=>ua.user_id === userId);
                // Calculate progress if not completed
                let progress;
                if (!userAchievement && stats) {
                    const requirements = achievement.requirements;
                    let current = 0;
                    let target = 0;
                    if (requirements.goals) {
                        current = stats.total_goals || 0;
                        target = requirements.goals;
                    } else if (requirements.assists) {
                        current = stats.total_assists || 0;
                        target = requirements.assists;
                    } else if (requirements.matches_played) {
                        current = stats.total_games_played || 0;
                        target = requirements.matches_played;
                    }
                    if (target > 0) {
                        progress = {
                            current,
                            target,
                            percentage: Math.min(100, Math.round(current / target * 100))
                        };
                    }
                }
                return {
                    achievement,
                    userAchievement: userAchievement || null,
                    progress
                };
            })) || [];
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
                limit: options.limit || 50,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 50)),
                hasNext: (options.offset || 0) + (options.limit || 50) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: achievementData,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerAchievements'),
                success: false
            };
        }
    }
    /**
   * Get player's team join requests
   */ async getTeamJoinRequests(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            let query = this.supabase.from('team_join_requests').select("\n          *,\n          team:teams!inner(\n            *,\n            league:leagues!inner(*)\n          )\n        ").eq('user_id', userId);
            if (options.status) {
                query = query.eq('status', options.status);
            }
            const { data, error } = await query.order('created_at', {
                ascending: false
            }).limit(options.limit || 50);
            if (error) throw error;
            return {
                data: data || [],
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getTeamJoinRequests'),
                success: false
            };
        }
    }
    /**
   * Submit a team join request
   */ async submitTeamJoinRequest(userId, teamId) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        try {
            // Check if user already has a pending request for this team
            const { data: existing, error: checkError } = await this.supabase.from('team_join_requests').select('id').eq('user_id', userId).eq('team_id', teamId).eq('status', 'pending').single();
            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existing) {
                return {
                    data: null,
                    error: {
                        code: 'DUPLICATE_REQUEST',
                        message: 'You already have a pending request for this team',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            const { data, error } = await this.supabase.from('team_join_requests').insert({
                user_id: userId,
                team_id: teamId,
                message: options.message,
                preferred_position: options.preferredPosition,
                requested_jersey_number: options.requestedJerseyNumber,
                status: 'pending',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            }).select().single();
            if (error) throw error;
            return {
                data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'submitTeamJoinRequest'),
                success: false
            };
        }
    }
    /**
   * Withdraw a team join request
   */ async withdrawTeamJoinRequest(userId, requestId) {
        try {
            const { data, error } = await this.supabase.from('team_join_requests').update({
                status: 'withdrawn'
            }).eq('id', requestId).eq('user_id', userId).eq('status', 'pending').select().single();
            if (error) throw error;
            return {
                data: true,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'withdrawTeamJoinRequest'),
                success: false
            };
        }
    }
    /**
   * Search for players across leagues
   */ async searchPlayers() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        try {
            let query = this.supabase.from('player_cross_league_stats').select('*', {
                count: 'exact'
            }).eq('season_year', new Date().getFullYear());
            if (options.query) {
                query = query.ilike('display_name', "%".concat(options.query, "%"));
            }
            if (options.minGames) {
                query = query.gte('total_games_played', options.minGames);
            }
            const { data, error, count } = await query.order('total_goals', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: data || [],
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'searchPlayers'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Subscribe to real-time updates for player data
   */ subscribeToPlayerUpdates(userId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'user_profiles',
            event: '*'
        };
        return this.supabase.channel("player-".concat(userId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "id=eq.".concat(userId)
        }, callback).subscribe();
    }
    /**
   * Clear cache for specific operations or all cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(PlayerService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/user.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * User Service for MatchDay
 * 
 * Handles user profile operations with Supabase integration.
 * Provides CRUD operations for user profiles and related data.
 */ __turbopack_context__.s({
    "UserService": ()=>UserService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/lib/supabase/client.ts [app-client] (ecmascript)");
;
;
class UserService {
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    /**
   * Get user profile by ID
   */ async getUserProfile(userId) {
        console.log('📡 UserService - getUserProfile called for userId:', userId);
        try {
            console.log('📡 UserService - querying user_profiles table...');
            // Add timeout handling
            const timeoutPromise = new Promise((_, reject)=>setTimeout(()=>reject(new Error('getUserProfile request timed out after 10 seconds')), 10000));
            const queryPromise = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('users').select('*').eq('id', userId).single();
            const { data, error } = await Promise.race([
                queryPromise,
                timeoutPromise
            ]);
            console.log('📡 UserService - supabase response:', {
                hasData: !!data,
                error: error === null || error === void 0 ? void 0 : error.message,
                errorCode: error === null || error === void 0 ? void 0 : error.code,
                dataDisplayName: data === null || data === void 0 ? void 0 : data.display_name
            });
            if (error) {
                console.log('❌ UserService - returning error response:', error.message);
                return {
                    data: null,
                    error: {
                        code: 'PROFILE_NOT_FOUND',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            console.log('✅ UserService - returning success response');
            return {
                data: data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error instanceof Error ? error.message : 'An unexpected error occurred',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        }
    }
    /**
   * Update user profile
   */ async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('users').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', userId).select('*').single();
            if (error) {
                return {
                    data: null,
                    error: {
                        code: 'UPDATE_FAILED',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            return {
                data: data,
                error: null,
                success: true,
                message: 'Profile updated successfully'
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update profile',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        }
    }
    /**
   * Create user profile (typically called during signup)
   */ async createUserProfile(userId, profileData) {
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('users').insert({
                id: userId,
                display_name: profileData.display_name,
                preferred_position: profileData.preferred_position,
                location: profileData.location,
                bio: profileData.bio,
                date_of_birth: profileData.date_of_birth,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).select('*').single();
            if (error) {
                return {
                    data: null,
                    error: {
                        code: 'CREATE_FAILED',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            return {
                data: data,
                error: null,
                success: true,
                message: 'Profile created successfully'
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to create profile',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        }
    }
    /**
   * Check if user profile exists
   */ async profileExists(userId) {
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('users').select('id').eq('id', userId).maybeSingle();
            if (error) {
                return {
                    data: false,
                    error: {
                        code: 'CHECK_FAILED',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            return {
                data: !!data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: false,
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to check profile',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        }
    }
    /**
   * Get or create user profile (ensures profile exists)
   */ async getOrCreateUserProfile(userId, fallbackData) {
        try {
            // First try to get existing profile
            const profileResult = await this.getUserProfile(userId);
            if (profileResult.success && profileResult.data) {
                return profileResult;
            }
            // If profile doesn't exist and we have fallback data, create it
            if (fallbackData) {
                return await this.createUserProfile(userId, fallbackData);
            }
            // No profile and no fallback data
            return {
                data: null,
                error: {
                    code: 'PROFILE_NOT_FOUND',
                    message: 'User profile not found and no fallback data provided',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get or create profile',
                    timestamp: new Date().toISOString()
                },
                success: false
            };
        }
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(UserService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/stats.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Stats Service for MatchDay
 * 
 * Handles comprehensive performance analytics operations with focus on:
 * - Individual player statistics and trends
 * - Cross-league performance comparisons
 * - Global rankings and leaderboards
 * - Performance trend analysis and predictions
 * 
 * Optimized for providing deep insights into player performance across leagues
 */ __turbopack_context__.s({
    "StatsService": ()=>StatsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class StatsService {
    static getInstance(supabaseClient) {
        if (!StatsService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            StatsService.instance = new StatsService(supabaseClient);
        }
        return StatsService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("StatsService.".concat(operation, ":"), {
            error,
            errorType: typeof error,
            errorKeys: error ? Object.keys(error) : [],
            errorCode: error === null || error === void 0 ? void 0 : error.code,
            errorMessage: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
        // Handle specific database errors
        if ((error === null || error === void 0 ? void 0 : error.code) === 'PGRST116') {
            return {
                code: 'NOT_FOUND',
                message: 'No data found for the requested user',
                details: {
                    originalError: error,
                    operation
                },
                timestamp: new Date().toISOString()
            };
        }
        // Handle empty error objects
        if (!error || typeof error === 'object' && Object.keys(error).length === 0) {
            return {
                code: 'EMPTY_ERROR',
                message: 'An unknown error occurred with no error details',
                details: {
                    operation,
                    receivedError: error
                },
                timestamp: new Date().toISOString()
            };
        }
        return {
            code: (error === null || error === void 0 ? void 0 : error.code) || 'UNKNOWN_ERROR',
            message: (error === null || error === void 0 ? void 0 : error.message) || 'An unexpected error occurred',
            details: (error === null || error === void 0 ? void 0 : error.details) || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "stats_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 900;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Get comprehensive player performance analysis
   */ async getPlayerPerformanceAnalysis(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getPlayerPerformanceAnalysis', {
                userId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const seasonYear = options.seasonYear || new Date().getFullYear();
            // Get player profile
            const { data: profile, error: profileError } = await this.supabase.from('users').select('display_name, avatar_url, preferred_position').eq('id', userId).single();
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            // If no profile exists, create a default one for the analysis
            const playerProfile = profile || {
                display_name: 'Unknown Player',
                avatar_url: null,
                preferred_position: null
            };
            // Try to get cross-league stats (table may not exist yet)
            let crossLeagueStats = null;
            try {
                const { data: stats, error: statsError } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', seasonYear).single();
                if (statsError && statsError.code !== 'PGRST116') {
                    console.warn('player_cross_league_stats table not found, will generate stats from player_stats');
                } else {
                    crossLeagueStats = stats;
                }
            } catch (error) {
                console.warn('player_cross_league_stats table not available, using fallback approach');
            }
            // Get individual league stats for detailed analysis
            const { data: leagueStats, error: leagueError } = await this.supabase.from('player_stats').select("\n          *,\n          league:leagues!inner(*),\n          team:teams!inner(*)\n        ").eq('player_id', userId).eq('season_year', seasonYear);
            if (leagueError) throw leagueError;
            // If no cross-league stats, generate them from individual league stats
            if (!crossLeagueStats && leagueStats && leagueStats.length > 0) {
                crossLeagueStats = this.generateCrossLeagueStatsFromPlayerStats(leagueStats);
            }
            // Calculate performance trends (with error handling)
            let trends;
            try {
                trends = await this.calculatePerformanceTrends(userId, seasonYear);
            } catch (trendsError) {
                console.warn('Failed to calculate performance trends:', trendsError);
                trends = {
                    data: {
                        goals: [],
                        assists: [],
                        overall: []
                    },
                    error: null,
                    success: false
                };
            }
            // Calculate overall rating
            const overallRating = this.calculateOverallRating(crossLeagueStats, leagueStats || []);
            // Analyze strengths and improvements
            const { strengths, improvements } = this.analyzePlayerStrengthsAndWeaknesses(crossLeagueStats, leagueStats || []);
            // Calculate comparisons if requested
            let comparisons;
            if (options.includeComparisons) {
                comparisons = await this.calculatePlayerComparisons(userId, playerProfile.preferred_position, crossLeagueStats, seasonYear);
            }
            // Calculate predictions if requested
            let predictions;
            if (options.includePredictions) {
                predictions = await this.calculateSeasonPredictions(userId, crossLeagueStats, trends.data);
            }
            const analysis = {
                playerId: userId,
                playerName: playerProfile.display_name,
                avatarUrl: playerProfile.avatar_url,
                overallRating,
                strengths,
                improvements,
                trends: trends.data || {
                    goals: [],
                    assists: [],
                    overall: []
                },
                comparisons: comparisons || {
                    vsLeagueAverage: {
                        goals: 0,
                        assists: 0,
                        performance: 0
                    },
                    vsPositionAverage: {
                        goals: 0,
                        assists: 0,
                        performance: 0
                    },
                    improvement: {
                        last30Days: 0,
                        last3Months: 0,
                        season: 0
                    }
                },
                predictions: predictions || {
                    seasonEndGoals: (crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.total_goals) || 0,
                    seasonEndAssists: (crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.total_assists) || 0,
                    confidenceLevel: 50
                }
            };
            // Cache for 15 minutes
            this.setCache(cacheKey, analysis, 900);
            return {
                data: analysis,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerPerformanceAnalysis'),
                success: false
            };
        }
    }
    /**
   * Get global player rankings across different stats
   */ async getGlobalRankings(statType) {
        let filters = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        try {
            const cacheKey = this.getCacheKey('getGlobalRankings', {
                statType,
                filters,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true,
                    pagination: {
                        page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
                        limit: options.limit || 50,
                        total: cached.length,
                        totalPages: Math.ceil(cached.length / (options.limit || 50)),
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            // Use RPC function for complex ranking calculation
            const { data: rankings, error } = await this.supabase.rpc('get_global_rankings', {
                stat_type: statType,
                sport_type_filter: filters.sportType || null,
                league_type_filter: filters.leagueType || null,
                season_year_filter: filters.seasonYear || new Date().getFullYear(),
                min_games_filter: filters.minGames || 1,
                position_filter: filters.position || null,
                limit_count: options.limit || 50,
                offset_count: options.offset || 0
            });
            if (error) throw error;
            const globalRankings = (rankings || []).map((entry, index)=>({
                    playerId: entry.player_id,
                    displayName: entry.display_name,
                    avatarUrl: entry.avatar_url,
                    rank: (options.offset || 0) + index + 1,
                    statValue: entry.stat_value,
                    trend: 'stable',
                    previousRank: entry.previous_rank
                }));
            // Cache for 30 minutes
            this.setCache(cacheKey, globalRankings, 1800);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
                limit: options.limit || 50,
                total: globalRankings.length,
                totalPages: Math.ceil(globalRankings.length / (options.limit || 50)),
                hasNext: globalRankings.length === (options.limit || 50),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: globalRankings,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getGlobalRankings'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 50,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Get cross-league performance comparison for a player
   */ async getCrossLeagueComparison(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getCrossLeagueComparison', {
                userId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const seasonYear = options.seasonYear || new Date().getFullYear();
            // Get player profile
            const { data: profile, error: profileError } = await this.supabase.from('users').select('display_name').eq('id', userId).single();
            if (profileError) throw profileError;
            // Get player's stats across leagues
            const { data: playerStats, error: statsError } = await this.supabase.from('player_stats').select("\n          *,\n          league:leagues!inner(*),\n          team:teams!inner(*)\n        ").eq('player_id', userId).eq('season_year', seasonYear);
            if (statsError) throw statsError;
            // Process league comparisons
            const leagues = await Promise.all((playerStats || []).map(async (stat)=>{
                // Get league rankings for this player
                const rank = await this.getPlayerLeagueRank(userId, stat.league_id, seasonYear);
                // Calculate performance metrics
                const performance = {
                    goalsPerGame: stat.games_played > 0 ? (stat.goals || 0) / stat.games_played : 0,
                    assistsPerGame: stat.games_played > 0 ? (stat.assists || 0) / stat.games_played : 0,
                    consistency: this.calculateConsistency(stat),
                    improvement: 0 // Would need historical data
                };
                // Calculate adaptability
                const adaptability = this.calculateAdaptability(stat, stat.league);
                return {
                    league: stat.league,
                    stats: stat,
                    rank: rank.data || {
                        goals: 999,
                        assists: 999,
                        overall: 999
                    },
                    performance,
                    adaptability
                };
            }));
            // Calculate overall analysis
            const overallAnalysis = this.calculateOverallCrossLeagueAnalysis(leagues);
            // Generate recommendations
            const recommendations = this.generateCrossLeagueRecommendations(leagues, overallAnalysis);
            const comparison = {
                playerId: userId,
                playerName: profile.display_name,
                leagues,
                overallAnalysis,
                recommendations
            };
            // Cache for 20 minutes
            this.setCache(cacheKey, comparison, 1200);
            return {
                data: comparison,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getCrossLeagueComparison'),
                success: false
            };
        }
    }
    /**
   * Get comprehensive league analytics
   */ async getLeagueAnalytics(leagueId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getLeagueAnalytics', {
                leagueId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const seasonYear = options.seasonYear || new Date().getFullYear();
            // Get league details
            const { data: league, error: leagueError } = await this.supabase.from('leagues').select('*').eq('id', leagueId).single();
            if (leagueError) throw leagueError;
            // Get league statistics using RPC
            const { data: leagueStats, error: statsError } = await this.supabase.rpc('get_league_analytics', {
                league_id: leagueId,
                season_year: seasonYear
            });
            if (statsError) throw statsError;
            // Get top performers
            const topPerformers = await this.getLeagueTopPerformers(leagueId, seasonYear);
            // Calculate trends
            const trends = await this.calculateLeagueTrends(leagueId, seasonYear);
            // Generate insights
            let insights = [];
            if (options.includeInsights) {
                insights = this.generateLeagueInsights(leagueStats, topPerformers.data, trends.data);
            }
            const analytics = {
                leagueId,
                leagueName: league.name,
                sportType: league.sport_type,
                totalPlayers: (leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.total_players) || 0,
                totalTeams: (leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.total_teams) || 0,
                totalMatches: (leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.total_matches) || 0,
                averageGoalsPerGame: (leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.average_goals_per_game) || 0,
                competitiveness: {
                    score: (leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.competitiveness_score) || 50,
                    description: this.getCompetitivenessDescription((leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.competitiveness_score) || 50)
                },
                topPerformers: topPerformers.data || {
                    goals: [],
                    assists: [],
                    overall: []
                },
                trends: trends.data || {
                    playerGrowth: 0,
                    matchActivity: 0,
                    competitiveBalance: 0
                },
                insights
            };
            // Cache for 1 hour
            this.setCache(cacheKey, analytics, 3600);
            return {
                data: analytics,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getLeagueAnalytics'),
                success: false
            };
        }
    }
    /**
   * Get performance trends for a player over time
   */ async getPerformanceTrends(userId, options) {
        try {
            const cacheKey = this.getCacheKey('getPerformanceTrends', {
                userId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            const trends = await this.calculatePerformanceTrends(userId, options.seasonYear || new Date().getFullYear(), options.period, options.statTypes);
            return trends;
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPerformanceTrends'),
                success: false
            };
        }
    }
    /**
   * Private helper methods
   */ generateCrossLeagueStatsFromPlayerStats(playerStats) {
        var _playerStats_;
        const totalGoals = playerStats.reduce((sum, stat)=>sum + (stat.goals || 0), 0);
        const totalAssists = playerStats.reduce((sum, stat)=>sum + (stat.assists || 0), 0);
        const totalGames = playerStats.reduce((sum, stat)=>sum + (stat.games_played || 0), 0);
        const leaguesPlayed = new Set(playerStats.map((stat)=>stat.league_id)).size;
        const teamsPlayed = new Set(playerStats.map((stat)=>stat.team_id)).size;
        return {
            player_id: ((_playerStats_ = playerStats[0]) === null || _playerStats_ === void 0 ? void 0 : _playerStats_.player_id) || '',
            display_name: 'Generated Stats',
            avatar_url: null,
            preferred_position: null,
            season_year: new Date().getFullYear(),
            leagues_played: leaguesPlayed,
            teams_played: teamsPlayed,
            total_games_played: totalGames,
            total_goals: totalGoals,
            total_assists: totalAssists,
            total_yellow_cards: playerStats.reduce((sum, stat)=>sum + (stat.yellow_cards || 0), 0),
            total_red_cards: playerStats.reduce((sum, stat)=>sum + (stat.red_cards || 0), 0),
            avg_goals_per_game: totalGames > 0 ? totalGoals / totalGames : 0,
            avg_contributions_per_game: totalGames > 0 ? (totalGoals + totalAssists) / totalGames : 0,
            goals_consistency: totalGames > 0 ? this.calculateGoalsConsistency(playerStats) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
    calculateGoalsConsistency(playerStats) {
        if (playerStats.length === 0) return 0;
        const goalRates = playerStats.map((stat)=>(stat.games_played || 0) > 0 ? (stat.goals || 0) / (stat.games_played || 1) : 0);
        const avgRate = goalRates.reduce((sum, rate)=>sum + rate, 0) / goalRates.length;
        const variance = goalRates.reduce((sum, rate)=>sum + Math.pow(rate - avgRate, 2), 0) / goalRates.length;
        return Math.sqrt(variance);
    }
    async calculatePerformanceTrends(userId, seasonYear) {
        let period = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'monthly', statTypes = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : [
            'goals',
            'assists',
            'performance'
        ];
        try {
            // Check if the RPC function exists first, if not return empty trends
            const { data: trendsData, error } = await this.supabase.rpc('calculate_performance_trends', {
                player_id: userId,
                season_year: seasonYear,
                period_type: period,
                stat_types: statTypes
            });
            // If RPC function doesn't exist or has error, return empty trends
            if (error) {
                console.warn('Performance trends RPC function not available:', error);
                const emptyTrends = {};
                statTypes.forEach((statType)=>{
                    emptyTrends[statType] = [];
                });
                return {
                    data: emptyTrends,
                    error: null,
                    success: true
                };
            }
            // Process the trends data
            const trends = {};
            statTypes.forEach((statType)=>{
                trends[statType] = (trendsData === null || trendsData === void 0 ? void 0 : trendsData.filter((t)=>t.stat_type === statType).map((t)=>({
                        period: t.period,
                        goals: t.goals || 0,
                        assists: t.assists || 0,
                        matches: t.matches || 0,
                        performance: t.performance || 0
                    }))) || [];
            });
            return {
                data: trends,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculatePerformanceTrends'),
                success: false
            };
        }
    }
    calculateOverallRating(crossLeagueStats, leagueStats) {
        if (!crossLeagueStats || !leagueStats.length) return 50;
        // Simple rating calculation based on multiple factors
        const avgGoalsPerGame = crossLeagueStats.avg_goals_per_game || 0;
        const avgAssistsPerGame = crossLeagueStats.avg_contributions_per_game ? crossLeagueStats.avg_contributions_per_game - avgGoalsPerGame : 0;
        const consistency = crossLeagueStats.goals_consistency ? 100 - crossLeagueStats.goals_consistency * 10 : 50;
        const leagueVariety = crossLeagueStats.leagues_played || 1;
        const rating = Math.min(100, Math.max(0, avgGoalsPerGame * 20 + avgAssistsPerGame * 15 + consistency * 0.3 + leagueVariety * 2 + 30 // Base rating
        ));
        return Math.round(rating);
    }
    analyzePlayerStrengthsAndWeaknesses(crossLeagueStats, leagueStats) {
        const strengths = [];
        const improvements = [];
        if (!crossLeagueStats) {
            return {
                strengths: [
                    'New player - building experience'
                ],
                improvements: [
                    'Play more matches to build statistics'
                ]
            };
        }
        // Analyze strengths
        if (crossLeagueStats.avg_goals_per_game > 0.5) {
            strengths.push('Excellent goal scoring ability');
        }
        if (crossLeagueStats.avg_contributions_per_game > 0.7) {
            strengths.push('High overall contribution to team');
        }
        if (crossLeagueStats.leagues_played > 2) {
            strengths.push('Versatile across different leagues');
        }
        if (crossLeagueStats.total_games_played > 20) {
            strengths.push('Experienced and consistent player');
        }
        // Analyze improvements
        if (crossLeagueStats.avg_goals_per_game < 0.2) {
            improvements.push('Focus on creating more scoring opportunities');
        }
        if (crossLeagueStats.goals_consistency && crossLeagueStats.goals_consistency > 0.5) {
            improvements.push('Work on consistency in performance');
        }
        if (crossLeagueStats.leagues_played === 1) {
            improvements.push('Consider exploring different leagues for variety');
        }
        // Ensure we have at least some content
        if (strengths.length === 0) {
            strengths.push('Building experience and skills');
        }
        if (improvements.length === 0) {
            improvements.push('Continue developing match experience');
        }
        return {
            strengths,
            improvements
        };
    }
    async calculatePlayerComparisons(userId, position, crossLeagueStats, seasonYear) {
        // This would involve complex calculations comparing against league and position averages
        // Simplified implementation
        return {
            vsLeagueAverage: {
                goals: (crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_goals_per_game) || 0,
                assists: ((crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_contributions_per_game) || 0) - ((crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_goals_per_game) || 0),
                performance: 0
            },
            vsPositionAverage: {
                goals: (crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_goals_per_game) || 0,
                assists: ((crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_contributions_per_game) || 0) - ((crossLeagueStats === null || crossLeagueStats === void 0 ? void 0 : crossLeagueStats.avg_goals_per_game) || 0),
                performance: 0
            },
            improvement: {
                last30Days: 0,
                last3Months: 0,
                season: 0
            }
        };
    }
    async calculateSeasonPredictions(userId, crossLeagueStats, trends) {
        if (!crossLeagueStats) {
            return {
                seasonEndGoals: 0,
                seasonEndAssists: 0,
                confidenceLevel: 0
            };
        }
        // Simple prediction based on current performance
        const remainingWeeks = Math.max(0, 52 - new Date().getWeek());
        const currentRate = crossLeagueStats.avg_goals_per_game || 0;
        return {
            seasonEndGoals: Math.round((crossLeagueStats.total_goals || 0) + currentRate * remainingWeeks * 0.5),
            seasonEndAssists: Math.round((crossLeagueStats.total_assists || 0) + currentRate * 0.7 * remainingWeeks * 0.5),
            confidenceLevel: crossLeagueStats.total_games_played > 10 ? 75 : 45
        };
    }
    async getPlayerLeagueRank(userId, leagueId, seasonYear) {
        try {
            const { data, error } = await this.supabase.rpc('get_player_league_rank', {
                player_id: userId,
                league_id: leagueId,
                season_year: seasonYear
            });
            if (error) throw error;
            return {
                data: data || {
                    goals: 999,
                    assists: 999,
                    overall: 999
                },
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerLeagueRank'),
                success: false
            };
        }
    }
    calculateConsistency(stats) {
        // Simplified consistency calculation
        if (!stats.games_played || stats.games_played === 0) return 0;
        const goalConsistency = stats.goals ? stats.goals / stats.games_played * 100 : 0;
        const participationConsistency = stats.games_started ? stats.games_started / stats.games_played * 100 : 50;
        return Math.round((goalConsistency + participationConsistency) / 2);
    }
    calculateAdaptability(stats, league) {
        const factors = [];
        let score = 50;
        if (stats.games_played > 5) {
            score += 20;
            factors.push('Good match participation');
        }
        if (league.league_type === 'competitive' && (stats.goals || 0) > 0) {
            score += 15;
            factors.push('Performs well in competitive environment');
        }
        return {
            score: Math.min(100, score),
            factors
        };
    }
    calculateOverallCrossLeagueAnalysis(leagues) {
        const numLeagues = leagues.length;
        return {
            versatility: Math.min(100, numLeagues * 25),
            consistency: numLeagues > 0 ? Math.round(leagues.reduce((sum, l)=>sum + l.performance.consistency, 0) / numLeagues) : 0,
            adaptability: numLeagues > 0 ? Math.round(leagues.reduce((sum, l)=>sum + l.adaptability.score, 0) / numLeagues) : 0,
            growthPotential: 75 // Simplified calculation
        };
    }
    generateCrossLeagueRecommendations(leagues, overallAnalysis) {
        const recommendations = [];
        if (leagues.length === 1) {
            recommendations.push('Consider joining additional leagues to showcase versatility');
        }
        if (overallAnalysis.consistency < 60) {
            recommendations.push('Focus on maintaining consistent performance across leagues');
        }
        if (overallAnalysis.adaptability < 70) {
            recommendations.push('Work on adapting your play style to different league formats');
        }
        return recommendations;
    }
    async getLeagueTopPerformers(leagueId, seasonYear) {
        try {
            // Get top goal scorers
            const { data: goalScorers, error: goalError } = await this.supabase.from('player_leaderboard').select('*').eq('league_id', leagueId).eq('season_year', seasonYear).order('goals', {
                ascending: false
            }).limit(10);
            if (goalError) throw goalError;
            // Get top assists
            const { data: assistLeaders, error: assistError } = await this.supabase.from('player_leaderboard').select('*').eq('league_id', leagueId).eq('season_year', seasonYear).order('assists', {
                ascending: false
            }).limit(10);
            if (assistError) throw assistError;
            // Get overall performers (based on goals + assists)
            const { data: overallPerformers, error: overallError } = await this.supabase.from('player_leaderboard').select('*').eq('league_id', leagueId).eq('season_year', seasonYear).order('goal_contributions_per_game', {
                ascending: false
            }).limit(10);
            if (overallError) throw overallError;
            const data = {
                goals: (goalScorers || []).map((player, index)=>({
                        playerId: player.player_id,
                        displayName: player.display_name,
                        avatarUrl: player.avatar_url,
                        rank: index + 1,
                        statValue: player.goals,
                        trend: 'stable'
                    })),
                assists: (assistLeaders || []).map((player, index)=>({
                        playerId: player.player_id,
                        displayName: player.display_name,
                        avatarUrl: player.avatar_url,
                        rank: index + 1,
                        statValue: player.assists,
                        trend: 'stable'
                    })),
                overall: (overallPerformers || []).map((player, index)=>({
                        playerId: player.player_id,
                        displayName: player.display_name,
                        avatarUrl: player.avatar_url,
                        rank: index + 1,
                        statValue: player.goals + player.assists,
                        trend: 'stable'
                    }))
            };
            return {
                data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getLeagueTopPerformers'),
                success: false
            };
        }
    }
    async calculateLeagueTrends(leagueId, seasonYear) {
        try {
            // Get league statistics for trends calculation
            const { data: currentStats, error: currentError } = await this.supabase.from('league_standings').select('*').eq('league_id', leagueId).eq('season_year', seasonYear);
            if (currentError) throw currentError;
            // Get previous year for comparison (if available)
            const { data: previousStats, error: previousError } = await this.supabase.from('league_standings').select('*').eq('league_id', leagueId).eq('season_year', seasonYear - 1);
            // Calculate trends
            const currentPlayerCount = (currentStats === null || currentStats === void 0 ? void 0 : currentStats.length) || 0;
            const previousPlayerCount = (previousStats === null || previousStats === void 0 ? void 0 : previousStats.length) || 0;
            const playerGrowth = previousPlayerCount > 0 ? Math.round((currentPlayerCount - previousPlayerCount) / previousPlayerCount * 100) : 0;
            // Calculate match activity based on games played
            const totalGames = (currentStats === null || currentStats === void 0 ? void 0 : currentStats.reduce((sum, team)=>sum + (team.games_played || 0), 0)) || 0;
            const expectedGames = currentPlayerCount * 10; // Assuming ~10 games per season
            const matchActivity = expectedGames > 0 ? Math.min(100, Math.round(totalGames / expectedGames * 100)) : 0;
            // Calculate competitive balance based on points distribution
            const points = (currentStats === null || currentStats === void 0 ? void 0 : currentStats.map((team)=>team.points || 0)) || [];
            const avgPoints = points.length > 0 ? points.reduce((a, b)=>a + b, 0) / points.length : 0;
            const pointsVariance = points.length > 0 ? points.reduce((sum, points)=>sum + Math.pow(points - avgPoints, 2), 0) / points.length : 0;
            const competitiveBalance = points.length > 0 ? Math.max(0, Math.min(100, 100 - Math.sqrt(pointsVariance) / avgPoints * 100)) : 50;
            const data = {
                playerGrowth: Math.max(-100, Math.min(100, playerGrowth)),
                matchActivity: Math.max(0, Math.min(100, matchActivity)),
                competitiveBalance: Math.max(0, Math.min(100, Math.round(competitiveBalance)))
            };
            return {
                data,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: {
                    playerGrowth: 0,
                    matchActivity: 0,
                    competitiveBalance: 50
                },
                error: this.handleError(error, 'calculateLeagueTrends'),
                success: false
            };
        }
    }
    generateLeagueInsights(leagueStats, topPerformers, trends) {
        const insights = [];
        if ((leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.competitiveness_score) > 80) {
            insights.push('Highly competitive league with balanced teams');
        } else if ((leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.competitiveness_score) < 40) {
            insights.push('Consider strategies to improve competitive balance');
        }
        if ((trends === null || trends === void 0 ? void 0 : trends.playerGrowth) > 20) {
            insights.push('Strong player growth indicating healthy league development');
        }
        if ((leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.average_goals_per_game) > 3) {
            insights.push('High-scoring league with attacking play style');
        } else if ((leagueStats === null || leagueStats === void 0 ? void 0 : leagueStats.average_goals_per_game) < 1.5) {
            insights.push('Defensive-minded league with tight matches');
        }
        return insights;
    }
    getCompetitivenessDescription(score) {
        if (score >= 80) return 'Highly competitive with balanced teams';
        if (score >= 60) return 'Good competitive balance';
        if (score >= 40) return 'Moderate competitiveness';
        return 'Needs improvement in competitive balance';
    }
    /**
   * Subscribe to real-time stats updates
   */ subscribeToStatsUpdates(userId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'player_stats',
            event: '*'
        };
        return this.supabase.channel("stats-".concat(userId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "player_id=eq.".concat(userId)
        }, callback).subscribe();
    }
    /**
   * Clear cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StatsService, "instance", void 0);
Date.prototype.getWeek = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/analytics.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Analytics Service for MatchDay
 * 
 * Handles cross-league comparisons and advanced statistics that make amateur
 * players feel professional. Provides comprehensive analytics across all leagues.
 * 
 * @example
 * ```typescript
 * const ranking = await AnalyticsService.getInstance().getGlobalPlayerRanking(userId);
 * const comparison = await AnalyticsService.getInstance().comparePlayerAcrossLeagues(userId);
 * ```
 * 
 * This service should be used for ALL analytics and comparison operations.
 */ __turbopack_context__.s({
    "AnalyticsService": ()=>AnalyticsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class AnalyticsService {
    static getInstance() {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
    }
    /**
   * Get global player ranking across all leagues
   */ async getGlobalPlayerRanking(playerId) {
        const { data, error } = await this.supabase.rpc('get_global_player_ranking', {
            player_id: playerId
        });
        if (error) throw error;
        return data;
    }
    /**
   * Compare player performance across different leagues
   */ async comparePlayerAcrossLeagues(playerId) {
        // Get player stats across all leagues
        const { data: playerStats, error: statsError } = await this.supabase.from('player_stats').select("\n        *,\n        leagues(id, name, sport_type),\n        teams(name)\n      ").eq('player_id', playerId);
        if (statsError) throw statsError;
        // Calculate aggregated stats
        const totalStats = playerStats.reduce((acc, stat)=>({
                totalGoals: acc.totalGoals + (stat.goals || 0),
                totalAssists: acc.totalAssists + (stat.assists || 0),
                totalGames: acc.totalGames + (stat.games_played || 0),
                totalMinutes: acc.totalMinutes + (stat.minutes_played || 0)
            }), {
            totalGoals: 0,
            totalAssists: 0,
            totalGames: 0,
            totalMinutes: 0
        });
        // Get league-specific rankings
        const leagueBreakdown = await Promise.all(playerStats.map(async (stat)=>{
            const { data: ranking } = await this.supabase.rpc('get_league_player_ranking', {
                league_id: stat.league_id,
                player_id: playerId
            });
            return {
                leagueId: stat.league_id,
                leagueName: stat.leagues.name,
                sportType: stat.leagues.sport_type,
                goals: stat.goals || 0,
                assists: stat.assists || 0,
                games: stat.games_played || 0,
                rank: (ranking === null || ranking === void 0 ? void 0 : ranking.rank) || 0,
                percentile: (ranking === null || ranking === void 0 ? void 0 : ranking.percentile) || 0
            };
        }));
        // Get global comparison data
        const { data: globalData } = await this.supabase.rpc('get_player_global_comparison', {
            player_id: playerId,
            total_goals: totalStats.totalGoals
        });
        return {
            playerId,
            playerStats: {
                ...totalStats,
                averageGoalsPerGame: totalStats.totalGames > 0 ? totalStats.totalGoals / totalStats.totalGames : 0
            },
            leagueBreakdown,
            globalComparison: globalData || {
                betterThanPercent: 0,
                similarPlayers: []
            }
        };
    }
    /**
   * Get global leaderboards with various filters
   */ async getGlobalLeaderboards(options) {
        const { data, error } = await this.supabase.rpc('get_global_leaderboard', {
            stat_category: options.category,
            time_frame: options.timeframe,
            sport_filter: options.sportType,
            result_limit: options.limit || 50
        });
        if (error) throw error;
        return {
            category: options.category,
            timeframe: options.timeframe,
            sportType: options.sportType,
            players: data || []
        };
    }
    /**
   * Get player performance trends over time
   */ async getPlayerTrends(playerId) {
        let timeframe = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'season';
        const { data, error } = await this.supabase.rpc('get_player_trends', {
            player_id: playerId,
            time_frame: timeframe
        });
        if (error) throw error;
        return data || {
            goals: [],
            assists: [],
            gamesPlayed: []
        };
    }
    /**
   * Compare teams across leagues
   */ async compareTeamsAcrossLeagues(teamIds) {
        const { data, error } = await this.supabase.rpc('compare_teams_across_leagues', {
            team_ids: teamIds
        });
        if (error) throw error;
        return data || [];
    }
    /**
   * Get league strength rankings
   */ async getLeagueStrengthRankings(sportType) {
        const { data, error } = await this.supabase.rpc('get_league_strength_rankings', {
            sport_filter: sportType
        });
        if (error) throw error;
        return data || [];
    }
    /**
   * Get player's achievement progress compared to others
   */ async getAchievementComparison(playerId) {
        const { data, error } = await this.supabase.rpc('get_achievement_comparison', {
            player_id: playerId
        });
        if (error) throw error;
        return data || {
            totalAchievements: 0,
            globalRank: 0,
            percentileRank: 0,
            recentAchievements: [],
            recommendedAchievements: []
        };
    }
    /**
   * Get comprehensive player profile for cross-league display
   */ async getPlayerGlobalProfile(playerId) {
        const { data, error } = await this.supabase.rpc('get_player_global_profile', {
            player_id: playerId
        });
        if (error) throw error;
        return data;
    }
    /**
   * Search and filter players across all leagues
   */ async searchPlayersGlobally(options) {
        const { data, error } = await this.supabase.rpc('search_players_globally', options);
        if (error) throw error;
        return data || [];
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(AnalyticsService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/database/src/database.types.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Database Types for MatchDay
 * 
 * Generated TypeScript types for the database schema.
 * These types ensure type safety across the application.
 */ __turbopack_context__.s({
    "AchievementCategory": ()=>AchievementCategory,
    "AchievementDifficulty": ()=>AchievementDifficulty,
    "EventType": ()=>EventType,
    "JoinRequestStatus": ()=>JoinRequestStatus,
    "LeagueType": ()=>LeagueType,
    "MatchStatus": ()=>MatchStatus,
    "SportType": ()=>SportType
});
var SportType = /*#__PURE__*/ function(SportType) {
    SportType["FOOTBALL"] = "football";
    return SportType;
}({});
var LeagueType = /*#__PURE__*/ function(LeagueType) {
    LeagueType["COMPETITIVE"] = "competitive";
    LeagueType["CASUAL"] = "casual";
    LeagueType["TOURNAMENT"] = "tournament";
    LeagueType["FRIENDLY"] = "friendly";
    return LeagueType;
}({});
var MatchStatus = /*#__PURE__*/ function(MatchStatus) {
    MatchStatus["SCHEDULED"] = "scheduled";
    MatchStatus["LIVE"] = "live";
    MatchStatus["COMPLETED"] = "completed";
    MatchStatus["POSTPONED"] = "postponed";
    MatchStatus["CANCELLED"] = "cancelled";
    return MatchStatus;
}({});
var EventType = /*#__PURE__*/ function(EventType) {
    EventType["GOAL"] = "goal";
    EventType["ASSIST"] = "assist";
    EventType["YELLOW_CARD"] = "yellow_card";
    EventType["RED_CARD"] = "red_card";
    EventType["SUBSTITUTION"] = "substitution";
    EventType["INJURY"] = "injury";
    EventType["TIMEOUT"] = "timeout";
    return EventType;
}({});
var AchievementCategory = /*#__PURE__*/ function(AchievementCategory) {
    AchievementCategory["GOALS"] = "goals";
    AchievementCategory["ASSISTS"] = "assists";
    AchievementCategory["MATCHES"] = "matches";
    AchievementCategory["TEAM_PLAY"] = "team_play";
    AchievementCategory["CONSISTENCY"] = "consistency";
    AchievementCategory["MILESTONES"] = "milestones";
    AchievementCategory["LEADERSHIP"] = "leadership";
    return AchievementCategory;
}({});
var AchievementDifficulty = /*#__PURE__*/ function(AchievementDifficulty) {
    AchievementDifficulty["BRONZE"] = "bronze";
    AchievementDifficulty["SILVER"] = "silver";
    AchievementDifficulty["GOLD"] = "gold";
    AchievementDifficulty["PLATINUM"] = "platinum";
    return AchievementDifficulty;
}({});
var JoinRequestStatus = /*#__PURE__*/ function(JoinRequestStatus) {
    JoinRequestStatus["PENDING"] = "pending";
    JoinRequestStatus["APPROVED"] = "approved";
    JoinRequestStatus["REJECTED"] = "rejected";
    JoinRequestStatus["WITHDRAWN"] = "withdrawn";
    return JoinRequestStatus;
}({});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/database/src/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * @matchday/database
 *
 * Shared database types and utilities for MatchDay monorepo
 */ __turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$database$2e$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/database.types.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/database/src/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$database$2e$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/database.types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-client] (ecmascript) <locals>");
}),
"[project]/packages/services/src/achievement.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Achievement Service for MatchDay
 * 
 * Handles comprehensive achievement and gamification operations with focus on:
 * - Player achievements and progress tracking
 * - Badge system and rarity calculations
 * - Cross-league milestone tracking
 * - Achievement recommendation system
 * 
 * Optimized for motivating player engagement through gamification
 */ __turbopack_context__.s({
    "AchievementService": ()=>AchievementService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$database$2e$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/database.types.ts [app-client] (ecmascript)");
;
;
class AchievementService {
    static getInstance(supabaseClient) {
        if (!AchievementService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            AchievementService.instance = new AchievementService(supabaseClient);
        }
        return AchievementService.instance;
    }
    /**
   * Handle service errors consistently
   */ handleError(error, operation) {
        console.error("AchievementService.".concat(operation, ":"), error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
   * Cache management utilities
   */ getCacheKey(operation, params) {
        return "achievement_service:".concat(operation, ":").concat(JSON.stringify(params));
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        let ttl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 600;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
   * Get comprehensive achievement statistics for a player
   */ async getPlayerAchievementStats(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getPlayerAchievementStats', {
                userId
            });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.revalidateOnBackground) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get all achievements
            const { data: allAchievements, error: achievementsError } = await this.supabase.from('achievements').select('*').eq('is_active', true).order('sort_order');
            if (achievementsError) throw achievementsError;
            // Get user's earned achievements
            const { data: userAchievements, error: userError } = await this.supabase.from('user_achievements').select("\n          *,\n          achievement:achievements!inner(*)\n        ").eq('user_id', userId).order('earned_at', {
                ascending: false
            });
            if (userError) throw userError;
            // Get player stats for progress calculation
            const { data: playerStats } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', new Date().getFullYear()).single();
            const totalAchievements = (allAchievements === null || allAchievements === void 0 ? void 0 : allAchievements.length) || 0;
            const earnedAchievements = (userAchievements === null || userAchievements === void 0 ? void 0 : userAchievements.length) || 0;
            const totalPoints = (allAchievements === null || allAchievements === void 0 ? void 0 : allAchievements.reduce((sum, a)=>sum + a.points_value, 0)) || 0;
            const earnedPoints = (userAchievements === null || userAchievements === void 0 ? void 0 : userAchievements.reduce((sum, ua)=>sum + ua.achievement.points_value, 0)) || 0;
            // Calculate category progress
            const categoryProgress = this.calculateCategoryProgress(allAchievements || [], userAchievements || []);
            // Calculate difficulty progress
            const difficultyProgress = this.calculateDifficultyProgress(allAchievements || [], userAchievements || []);
            // Get recent achievements (last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentAchievements = (userAchievements === null || userAchievements === void 0 ? void 0 : userAchievements.filter((ua)=>new Date(ua.earned_at) >= thirtyDaysAgo)) || [];
            // Calculate next milestones
            const nextMilestones = this.calculateNextMilestones(allAchievements || [], userAchievements || [], playerStats);
            const stats = {
                totalAchievements,
                earnedAchievements,
                totalPoints,
                earnedPoints,
                completionPercentage: totalAchievements > 0 ? Math.round(earnedAchievements / totalAchievements * 100) : 0,
                categoryProgress,
                difficultyProgress,
                recentAchievements,
                nextMilestones
            };
            // Cache for 5 minutes
            this.setCache(cacheKey, stats, options.ttl || 300);
            return {
                data: stats,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerAchievementStats'),
                success: false
            };
        }
    }
    /**
   * Get player's achievement badges with rarity information
   */ async getPlayerAchievementBadges(userId) {
        let filters = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        try {
            // Build query for user achievements
            let query = this.supabase.from('user_achievements').select("\n          *,\n          achievement:achievements!inner(*)\n        ", {
                count: 'exact'
            }).eq('user_id', userId);
            if (filters.category) {
                query = query.eq('achievement.category', filters.category);
            }
            if (filters.difficulty) {
                query = query.eq('achievement.difficulty', filters.difficulty);
            }
            if (filters.search) {
                query = query.ilike('achievement.name', "%".concat(filters.search, "%"));
            }
            const { data: userAchievements, error, count } = await query.order('earned_at', {
                ascending: false
            }).range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error) throw error;
            // Calculate rarity for each achievement
            const badges = await Promise.all((userAchievements || []).map(async (ua)=>{
                const rarity = await this.calculateAchievementRarity(ua.achievement_id);
                return {
                    id: ua.achievement.id,
                    name: ua.achievement.name,
                    description: ua.achievement.description || '',
                    icon: ua.achievement.icon || '',
                    category: ua.achievement.category,
                    difficulty: ua.achievement.difficulty,
                    earnedAt: ua.earned_at,
                    context: ua.context,
                    rarity: rarity.data || {
                        totalEarned: 0,
                        totalPlayers: 1,
                        rarityPercentage: 100
                    }
                };
            }));
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: (options.offset || 0) + (options.limit || 20) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: badges,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerAchievementBadges'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Get achievement progress tracking with detailed metrics
   */ async getAchievementProgress(userId) {
        let filters = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        try {
            // Get all available achievements
            let query = this.supabase.from('achievements').select('*', {
                count: 'exact'
            }).eq('is_active', true);
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }
            if (filters.search) {
                query = query.ilike('name', "%".concat(filters.search, "%"));
            }
            const { data: achievements, error, count } = await query.order('sort_order').range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);
            if (error) throw error;
            // Get user's earned achievements
            const { data: userAchievements, error: userError } = await this.supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId);
            if (userError) throw userError;
            // Get player stats for progress calculation
            const { data: playerStats } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', new Date().getFullYear()).single();
            const earnedAchievementIds = new Set((userAchievements === null || userAchievements === void 0 ? void 0 : userAchievements.map((ua)=>ua.achievement_id)) || []);
            // Calculate progress for each achievement
            const achievementProgress = (achievements || []).map((achievement)=>{
                const isCompleted = earnedAchievementIds.has(achievement.id);
                if (isCompleted) {
                    return {
                        achievement,
                        currentProgress: 1,
                        targetValue: 1,
                        progressPercentage: 100,
                        isCompleted: true
                    };
                }
                // Calculate progress based on requirements
                const progress = this.calculateAchievementProgress(achievement, playerStats);
                return {
                    achievement,
                    currentProgress: progress.current,
                    targetValue: progress.target,
                    progressPercentage: progress.percentage,
                    isCompleted: false,
                    estimatedCompletion: progress.estimatedCompletion,
                    nextMilestone: progress.nextMilestone
                };
            });
            // Apply filters
            let filteredProgress = achievementProgress;
            if (filters.earned === true) {
                filteredProgress = filteredProgress.filter((ap)=>ap.isCompleted);
            } else if (filters.earned === false) {
                filteredProgress = filteredProgress.filter((ap)=>!ap.isCompleted);
            }
            if (filters.inProgress === true) {
                filteredProgress = filteredProgress.filter((ap)=>!ap.isCompleted && ap.progressPercentage > 0);
            }
            // Sort by progress percentage (closest to completion first)
            filteredProgress.sort((a, b)=>{
                if (a.isCompleted && !b.isCompleted) return 1;
                if (!a.isCompleted && b.isCompleted) return -1;
                return b.progressPercentage - a.progressPercentage;
            });
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
                limit: options.limit || 50,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 50)),
                hasNext: (options.offset || 0) + (options.limit || 50) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: filteredProgress,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementProgress'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 50,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Get personalized achievement recommendations
   */ async getAchievementRecommendations(userId) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        try {
            const cacheKey = this.getCacheKey('getAchievementRecommendations', {
                userId,
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true
                };
            }
            // Get player's achievement progress
            const progressResponse = await this.getAchievementProgress(userId, {
                earned: false
            });
            if (!progressResponse.success || !progressResponse.data) {
                throw new Error('Failed to get achievement progress');
            }
            const progress = progressResponse.data;
            // Get player stats for context
            const { data: playerStats } = await this.supabase.from('player_cross_league_stats').select('*').eq('player_id', userId).eq('season_year', new Date().getFullYear()).single();
            // Generate recommendations
            const recommendations = progress.filter((ap)=>!ap.isCompleted).map((ap)=>this.generateRecommendation(ap, playerStats)).sort((a, b)=>b.priority - a.priority).slice(0, options.limit || 10);
            // Cache for 30 minutes
            this.setCache(cacheKey, recommendations, 1800);
            return {
                data: recommendations,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementRecommendations'),
                success: false
            };
        }
    }
    /**
   * Get achievement leaderboard
   */ async getAchievementLeaderboard() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        try {
            const cacheKey = this.getCacheKey('getAchievementLeaderboard', {
                options
            });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true,
                    pagination: {
                        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                        limit: options.limit || 20,
                        total: cached.length,
                        totalPages: Math.ceil(cached.length / (options.limit || 20)),
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            // Build query based on period
            let dateFilter = '';
            if (options.period === 'monthly') {
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = "and earned_at >= '".concat(monthAgo.toISOString(), "'");
            } else if (options.period === 'weekly') {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = "and earned_at >= '".concat(weekAgo.toISOString(), "'");
            }
            // Use RPC function for complex leaderboard calculation
            const { data: leaderboard, error } = await this.supabase.rpc('get_achievement_leaderboard', {
                date_filter: dateFilter,
                category_filter: options.category || null,
                limit_count: options.limit || 50,
                offset_count: options.offset || 0
            });
            if (error) throw error;
            const leaderboardEntries = (leaderboard || []).map((entry, index)=>({
                    playerId: entry.player_id,
                    playerName: entry.player_name,
                    avatarUrl: entry.avatar_url,
                    totalPoints: entry.total_points,
                    totalAchievements: entry.total_achievements,
                    recentAchievements: entry.recent_achievements || 0,
                    rank: (options.offset || 0) + index + 1,
                    trend: 'stable'
                }));
            // Cache for 10 minutes
            this.setCache(cacheKey, leaderboardEntries, 600);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: leaderboardEntries.length,
                totalPages: Math.ceil(leaderboardEntries.length / (options.limit || 20)),
                hasNext: leaderboardEntries.length === (options.limit || 20),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: leaderboardEntries,
                error: null,
                success: true,
                pagination
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementLeaderboard'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
   * Calculate achievement rarity
   */ async calculateAchievementRarity(achievementId) {
        try {
            const { data, error } = await this.supabase.rpc('calculate_achievement_rarity', {
                achievement_id: achievementId
            });
            if (error) throw error;
            return {
                data: data || {
                    totalEarned: 0,
                    totalPlayers: 1,
                    rarityPercentage: 100
                },
                error: null,
                success: true
            };
        } catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculateAchievementRarity'),
                success: false
            };
        }
    }
    /**
   * Private helper methods
   */ calculateCategoryProgress(allAchievements, userAchievements) {
        const categories = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$database$2e$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AchievementCategory"]);
        const result = {};
        categories.forEach((category)=>{
            const categoryAchievements = allAchievements.filter((a)=>a.category === category);
            const earnedCategoryAchievements = userAchievements.filter((ua)=>ua.achievement.category === category);
            result[category] = {
                total: categoryAchievements.length,
                earned: earnedCategoryAchievements.length,
                points: earnedCategoryAchievements.reduce((sum, ua)=>sum + ua.achievement.points_value, 0),
                percentage: categoryAchievements.length > 0 ? Math.round(earnedCategoryAchievements.length / categoryAchievements.length * 100) : 0
            };
        });
        return result;
    }
    calculateDifficultyProgress(allAchievements, userAchievements) {
        const difficulties = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$database$2e$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AchievementDifficulty"]);
        const result = {};
        difficulties.forEach((difficulty)=>{
            const difficultyAchievements = allAchievements.filter((a)=>a.difficulty === difficulty);
            const earnedDifficultyAchievements = userAchievements.filter((ua)=>ua.achievement.difficulty === difficulty);
            result[difficulty] = {
                total: difficultyAchievements.length,
                earned: earnedDifficultyAchievements.length,
                points: earnedDifficultyAchievements.reduce((sum, ua)=>sum + ua.achievement.points_value, 0)
            };
        });
        return result;
    }
    calculateNextMilestones(allAchievements, userAchievements, playerStats) {
        const earnedIds = new Set(userAchievements.map((ua)=>ua.achievement.id));
        return allAchievements.filter((a)=>!earnedIds.has(a.id)).map((achievement)=>{
            const progress = this.calculateAchievementProgress(achievement, playerStats);
            return {
                achievement,
                currentProgress: progress.current,
                targetValue: progress.target,
                progressPercentage: progress.percentage,
                isCompleted: false,
                estimatedCompletion: progress.estimatedCompletion,
                nextMilestone: progress.nextMilestone
            };
        }).filter((ap)=>ap.progressPercentage > 0).sort((a, b)=>b.progressPercentage - a.progressPercentage).slice(0, 5);
    }
    calculateAchievementProgress(achievement, playerStats) {
        const requirements = achievement.requirements;
        let current = 0;
        let target = 1;
        if (requirements.goals && playerStats) {
            current = playerStats.total_goals || 0;
            target = requirements.goals;
        } else if (requirements.assists && playerStats) {
            current = playerStats.total_assists || 0;
            target = requirements.assists;
        } else if (requirements.matches_played && playerStats) {
            current = playerStats.total_games_played || 0;
            target = requirements.matches_played;
        } else if (requirements.leagues_played && playerStats) {
            current = playerStats.leagues_played || 0;
            target = requirements.leagues_played;
        }
        const percentage = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
        // Estimate completion time based on current progress
        let estimatedCompletion;
        if (current > 0 && percentage < 100) {
            const remaining = target - current;
            const rate = current / Math.max((playerStats === null || playerStats === void 0 ? void 0 : playerStats.total_games_played) || 1, 1);
            const estimatedGames = remaining / Math.max(rate, 0.1);
            if (estimatedGames <= 5) {
                estimatedCompletion = 'Within 5 games';
            } else if (estimatedGames <= 10) {
                estimatedCompletion = 'Within 10 games';
            } else {
                estimatedCompletion = 'Long term goal';
            }
        }
        return {
            current,
            target,
            percentage,
            estimatedCompletion,
            nextMilestone: current > 0 ? Math.ceil(current * 1.2) : Math.ceil(target * 0.2)
        };
    }
    generateRecommendation(progress, playerStats) {
        let priority = 0;
        let reasonCode = 'category_focus';
        let reason = '';
        let estimatedEffort = 'medium';
        let estimatedTimeToComplete = 'Unknown';
        const tips = [];
        // Calculate priority based on progress percentage
        if (progress.progressPercentage >= 80) {
            priority = 90;
            reasonCode = 'close_to_completion';
            reason = 'You\'re very close to earning this achievement!';
            estimatedEffort = 'low';
            estimatedTimeToComplete = 'Very soon';
        } else if (progress.progressPercentage >= 50) {
            priority = 70;
            reasonCode = 'close_to_completion';
            reason = 'You\'re halfway there - keep it up!';
            estimatedEffort = 'medium';
            estimatedTimeToComplete = 'Medium term';
        } else if (progress.progressPercentage >= 25) {
            priority = 50;
            reasonCode = 'category_focus';
            reason = 'Good progress in this category';
            estimatedEffort = 'medium';
            estimatedTimeToComplete = 'Medium term';
        } else {
            priority = 30;
            reasonCode = 'difficulty_progression';
            reason = 'A good challenge to work towards';
            estimatedEffort = 'high';
            estimatedTimeToComplete = 'Long term';
        }
        // Add difficulty bonus
        switch(progress.achievement.difficulty){
            case 'bronze':
                priority += 10;
                break;
            case 'silver':
                priority += 5;
                break;
            case 'gold':
                priority -= 5;
                break;
            case 'platinum':
                priority -= 10;
                break;
        }
        // Generate tips based on achievement requirements
        const requirements = progress.achievement.requirements;
        if (requirements.goals) {
            tips.push('Focus on creating scoring opportunities');
            tips.push('Practice shooting accuracy in training');
        } else if (requirements.assists) {
            tips.push('Look for teammates in better positions');
            tips.push('Improve your passing accuracy');
        } else if (requirements.matches_played) {
            tips.push('Stay active in your leagues');
            tips.push('Consistency is key for this achievement');
        }
        return {
            achievement: progress.achievement,
            priority: Math.max(0, Math.min(100, priority)),
            reasonCode,
            reason,
            estimatedEffort,
            estimatedTimeToComplete,
            tips
        };
    }
    /**
   * Subscribe to real-time achievement updates
   */ subscribeToAchievementUpdates(userId, callback) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
            table: 'user_achievements',
            event: '*'
        };
        return this.supabase.channel("achievements-".concat(userId, "-updates")).on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || "user_id=eq.".concat(userId)
        }, callback).subscribe();
    }
    /**
   * Clear cache
   */ clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach((key)=>{
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    constructor(supabaseClient){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cache", new Map());
        this.supabase = supabaseClient;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(AchievementService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/edge-functions.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Edge Functions Service for MatchDay
 * 
 * Handles ALL server communication following the LEVER principle of server-side authority.
 * ALL business logic operations MUST go through Edge Functions to maintain data integrity,
 * security, and proper audit logging.
 * 
 * @example
 * ```typescript
 * const result = await EdgeFunctionsService.getInstance().createLeague(leagueData);
 * const match = await EdgeFunctionsService.getInstance().recordMatchResult(matchData);
 * ```
 * 
 * This service should be used for ALL write operations and complex business logic.
 */ __turbopack_context__.s({
    "EdgeFunctionsService": ()=>EdgeFunctionsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class EdgeFunctionsService {
    static getInstance() {
        if (!EdgeFunctionsService.instance) {
            EdgeFunctionsService.instance = new EdgeFunctionsService();
        }
        return EdgeFunctionsService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
    }
    async invokeFunction(functionName, payload) {
        try {
            const { data, error } = await this.supabase.functions.invoke(functionName, {
                body: payload
            });
            if (error) {
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Edge function ".concat(functionName, " failed:"), error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    // League Management
    async createLeague(leagueData) {
        return this.invokeFunction('create-league', leagueData);
    }
    async updateLeague(leagueId, updates) {
        return this.invokeFunction('update-league', {
            leagueId,
            updates
        });
    }
    async deleteLeague(leagueId) {
        return this.invokeFunction('delete-league', {
            leagueId
        });
    }
    // Team Management
    async createTeam(teamData) {
        return this.invokeFunction('create-team', teamData);
    }
    async joinTeam(teamId, playerData) {
        return this.invokeFunction('join-team', {
            teamId,
            ...playerData
        });
    }
    async leaveTeam(teamId) {
        return this.invokeFunction('leave-team', {
            teamId
        });
    }
    async updateTeamMember(teamId, userId, updates) {
        return this.invokeFunction('update-team-member', {
            teamId,
            userId,
            updates
        });
    }
    // Match Management
    async createMatch(matchData) {
        return this.invokeFunction('create-match', matchData);
    }
    async recordMatchResult(matchId, result) {
        return this.invokeFunction('record-match-result', {
            matchId,
            ...result
        });
    }
    async updateMatchStatus(matchId, status) {
        return this.invokeFunction('update-match-status', {
            matchId,
            status
        });
    }
    // Statistics & Achievements
    async recalculatePlayerStats(playerId, leagueId) {
        return this.invokeFunction('recalculate-player-stats', {
            playerId,
            leagueId
        });
    }
    async recalculateTeamStats(teamId) {
        return this.invokeFunction('recalculate-team-stats', {
            teamId
        });
    }
    async checkAchievements(userId, context) {
        return this.invokeFunction('check-achievements', {
            userId,
            context
        });
    }
    // Schedule Generation
    async generateLeagueSchedule(leagueId, options) {
        return this.invokeFunction('generate-schedule', {
            leagueId,
            options
        });
    }
    // Batch Operations
    async importPlayers(teamId, players) {
        return this.invokeFunction('import-players', {
            teamId,
            players
        });
    }
    async bulkCreateMatches(matches) {
        return this.invokeFunction('bulk-create-matches', {
            matches
        });
    }
    // User Profile
    async updateUserProfile(updates) {
        return this.invokeFunction('update-user-profile', updates);
    }
    // Cross-League Analytics
    async getCrossLeagueStats(userId) {
        return this.invokeFunction('get-cross-league-stats', {
            userId
        });
    }
    async getGlobalLeaderboards(options) {
        return this.invokeFunction('get-global-leaderboards', options || {});
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0); // Will be injected
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(EdgeFunctionsService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/config.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Configuration Service for MatchDay
 * 
 * Manages all application configuration following the LEVER principle of
 * centralized configuration management. Provides hierarchical config loading:
 * 1. Memory cache
 * 2. Local storage
 * 3. Supabase database
 * 4. Default fallbacks
 * 
 * @example
 * ```typescript
 * const config = await ConfigService.getInstance().getScoringRules();
 * const maxTeams = await ConfigService.getInstance().getLeagueSettings();
 * ```
 * 
 * This service should be used for ALL configuration access.
 */ __turbopack_context__.s({
    "ConfigService": ()=>ConfigService,
    "configService": ()=>configService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class ConfigService {
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
    }
    async getConfig(key) {
        // 1. Check memory cache
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }
        // 2. Check local storage
        if ("TURBOPACK compile-time truthy", 1) {
            const local = localStorage.getItem("matchday_config_".concat(key));
            if (local) {
                const parsed = JSON.parse(local);
                this.memoryCache.set(key, parsed);
                return parsed;
            }
        }
        // 3. Fetch from Supabase
        if (this.supabase) {
            try {
                const { data } = await this.supabase.from('app_configurations').select('value').eq('id', key).single();
                if (data) {
                    const value = data.value;
                    if ("TURBOPACK compile-time truthy", 1) {
                        localStorage.setItem("matchday_config_".concat(key), JSON.stringify(value));
                    }
                    this.memoryCache.set(key, value);
                    return value;
                }
            } catch (error) {
                console.warn("Failed to fetch config for ".concat(key, ":"), error);
            }
        }
        // 4. Fall back to defaults
        return this.getDefault(key);
    }
    getDefault(key) {
        const defaults = {
            scoring_rules: {
                win: 3,
                draw: 1,
                loss: 0
            },
            achievement_rules: {
                first_goal: {
                    points: 10
                },
                hat_trick: {
                    points: 50
                },
                clean_sheet: {
                    points: 25
                },
                mvp_game: {
                    points: 30
                },
                perfect_attendance: {
                    points: 100
                }
            },
            league_settings: {
                max_teams_per_league: 16,
                matches_per_season: 30,
                min_players_per_team: 11,
                max_players_per_team: 25
            },
            notification_settings: {
                match_reminders: true,
                score_updates: true,
                achievement_notifications: true
            }
        };
        return defaults[key] || null;
    }
    // Specific getters for commonly used configs
    async getScoringRules() {
        return this.getConfig('scoring_rules');
    }
    async getAchievementRules() {
        return this.getConfig('achievement_rules');
    }
    async getLeagueSettings() {
        return this.getConfig('league_settings');
    }
    // Clear cache when config is updated
    invalidateConfig(key) {
        if (key) {
            this.memoryCache.delete(key);
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.removeItem("matchday_config_".concat(key));
            }
        } else {
            this.memoryCache.clear();
            if ("TURBOPACK compile-time truthy", 1) {
                Object.keys(localStorage).filter((k)=>k.startsWith('matchday_config_')).forEach((k)=>localStorage.removeItem(k));
            }
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "memoryCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0); // Will be injected
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ConfigService, "instance", void 0);
const configService = ConfigService.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * @matchday/services
 *
 * Shared service layer for MatchDay monorepo
 */ __turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$league$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/league.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$team$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/team.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$match$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/match.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$season$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/season.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$player$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/player.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$user$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/user.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$stats$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/stats.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$analytics$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/analytics.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$achievement$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/achievement.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/edge-functions.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$config$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/config.service.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/services/src/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$league$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/league.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$team$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/team.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$match$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/match.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$season$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/season.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$player$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/player.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$user$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/user.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$stats$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/stats.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$analytics$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/analytics.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$achievement$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/achievement.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/edge-functions.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$config$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/config.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/services/src/index.ts [app-client] (ecmascript) <locals>");
}),
"[project]/packages/auth/src/auth.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Authentication Service for MatchDay
 * 
 * Handles user authentication and session management following LEVER principles.
 * Integrates with Supabase Auth and manages user profiles automatically.
 * 
 * @example
 * ```typescript
 * const { user, session } = await AuthService.getInstance().signInWithEmail(email, password);
 * await AuthService.getInstance().signOut();
 * ```
 * 
 * This service should be used for ALL authentication operations.
 */ __turbopack_context__.s({
    "AuthService": ()=>AuthService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/services/src/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/services/src/edge-functions.service.ts [app-client] (ecmascript)");
;
;
class AuthService {
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
        this.initializeAuthListener();
    }
    async initializeAuthListener() {
        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange(async (event, session)=>{
            if (session === null || session === void 0 ? void 0 : session.user) {
                // Fetch user profile
                const userWithProfile = await this.enrichUserWithProfile(session.user);
                this.currentUser = userWithProfile;
                this.currentSession = {
                    ...session,
                    user: userWithProfile
                };
            } else {
                this.currentUser = null;
                this.currentSession = null;
            }
            // Notify listeners
            this.listeners.forEach((listener)=>listener(this.currentUser));
        });
        // Get initial session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session === null || session === void 0 ? void 0 : session.user) {
            const userWithProfile = await this.enrichUserWithProfile(session.user);
            this.currentUser = userWithProfile;
            this.currentSession = {
                ...session,
                user: userWithProfile
            };
        }
    }
    async enrichUserWithProfile(user) {
        try {
            const { data: profile } = await this.supabase.from('users').select('*').eq('id', user.id).single();
            return {
                ...user,
                profile: profile || undefined
            };
        } catch (error) {
            console.warn('Failed to fetch user profile:', error);
            return user;
        }
    }
    /**
   * Sign up new user with automatic profile creation
   */ async signUp(data) {
        try {
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: data.email,
                password: data.password
            });
            if (authError) {
                return {
                    user: null,
                    session: null,
                    error: authError
                };
            }
            if (authData.user) {
                // Create user profile via Edge Function to ensure proper validation and audit logging
                const profileResult = await __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdgeFunctionsService"].getInstance().updateUserProfile({
                    display_name: data.displayName,
                    preferred_position: data.preferredPosition,
                    location: data.location
                });
                if (!profileResult.success) {
                    console.warn('Failed to create user profile:', profileResult.error);
                }
                const enrichedUser = await this.enrichUserWithProfile(authData.user);
                const enrichedSession = authData.session ? {
                    ...authData.session,
                    user: enrichedUser
                } : null;
                return {
                    user: enrichedUser,
                    session: enrichedSession,
                    error: null
                };
            }
            return {
                user: null,
                session: null,
                error: null
            };
        } catch (error) {
            return {
                user: null,
                session: null,
                error: error
            };
        }
    }
    /**
   * Sign in existing user
   */ async signIn(data) {
        try {
            const { data: authData, error } = await this.supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });
            if (error) {
                return {
                    user: null,
                    session: null,
                    error
                };
            }
            if (authData.user) {
                const enrichedUser = await this.enrichUserWithProfile(authData.user);
                const enrichedSession = {
                    ...authData.session,
                    user: enrichedUser
                };
                return {
                    user: enrichedUser,
                    session: enrichedSession,
                    error: null
                };
            }
            return {
                user: null,
                session: null,
                error: null
            };
        } catch (error) {
            return {
                user: null,
                session: null,
                error: error
            };
        }
    }
    /**
   * Sign in with OAuth providers (Google, etc.)
   */ async signInWithOAuth(provider) {
        try {
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: "".concat(window.location.origin, "/auth/callback")
                }
            });
            return {
                error
            };
        } catch (error) {
            return {
                error: error
            };
        }
    }
    /**
   * Sign out current user
   */ async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            return {
                error
            };
        } catch (error) {
            return {
                error: error
            };
        }
    }
    /**
   * Reset password
   */ async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "".concat(window.location.origin, "/auth/reset-password")
            });
            return {
                error
            };
        } catch (error) {
            return {
                error: error
            };
        }
    }
    /**
   * Update password
   */ async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });
            return {
                error
            };
        } catch (error) {
            return {
                error: error
            };
        }
    }
    /**
   * Update user profile
   */ async updateProfile(updates) {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$services$2f$src$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdgeFunctionsService"].getInstance().updateUserProfile(updates);
            if (!result.success) {
                return {
                    error: new Error(result.error)
                };
            }
            // Refresh current user data
            if (this.currentUser) {
                this.currentUser = await this.enrichUserWithProfile(this.currentUser);
                this.listeners.forEach((listener)=>listener(this.currentUser));
            }
            return {
                error: null
            };
        } catch (error) {
            return {
                error: error
            };
        }
    }
    /**
   * Get current user
   */ getCurrentUser() {
        return this.currentUser;
    }
    /**
   * Get current session
   */ getCurrentSession() {
        return this.currentSession;
    }
    /**
   * Check if user is authenticated
   */ isAuthenticated() {
        return !!this.currentUser;
    }
    /**
   * Subscribe to auth state changes
   */ onAuthStateChange(callback) {
        this.listeners.push(callback);
        // Return unsubscribe function
        return ()=>{
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    /**
   * Require authentication - throws if not authenticated
   */ requireAuth() {
        if (!this.currentUser) {
            throw new Error('Authentication required');
        }
        return this.currentUser;
    }
    /**
   * Check if user has specific permissions
   */ hasPermission(permission) {
        if (!this.currentUser) return false;
        // For now, all authenticated users can create leagues and manage teams
        // In the future, this could be enhanced with role-based permissions
        switch(permission){
            case 'create_league':
            case 'manage_team':
                return true;
            case 'admin':
                var _this_currentUser_user_metadata;
                // Check if user has admin role (would be stored in user metadata or separate table)
                return ((_this_currentUser_user_metadata = this.currentUser.user_metadata) === null || _this_currentUser_user_metadata === void 0 ? void 0 : _this_currentUser_user_metadata.role) === 'admin';
            default:
                return false;
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentUser", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentSession", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "listeners", []);
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(AuthService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/auth/src/validator.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
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
"[project]/packages/auth/src/role.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Role Service
 * 
 * Handles role-based authentication and authorization across the application.
 * Provides utilities for checking user roles and permissions.
 */ __turbopack_context__.s({
    "RoleService": ()=>RoleService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/player/src/lib/supabase/client.ts [app-client] (ecmascript)");
;
class RoleService {
    /**
   * Get the current user's role from their profile with timeout and retries
   */ static async getCurrentUserRole() {
        try {
            var _userResult_data;
            console.log('[RoleService] Getting current user...');
            // Add timeout to getUser call
            const userResult = await Promise.race([
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser(),
                new Promise((_, reject)=>setTimeout(()=>reject(new Error('getUser timeout')), 2000))
            ]);
            const user = (_userResult_data = userResult.data) === null || _userResult_data === void 0 ? void 0 : _userResult_data.user;
            if (!user) {
                console.log('[RoleService] No authenticated user found');
                return null;
            }
            console.log('[RoleService] Fetching user profile for:', user.id);
            // Add timeout to profile query with retry logic
            let lastError;
            for(let attempt = 1; attempt <= 2; attempt++){
                try {
                    const { data: profile, error } = await Promise.race([
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('users').select('role').eq('id', user.id).single(),
                        new Promise((_, reject)=>setTimeout(()=>reject(new Error('Profile query timeout')), 1500))
                    ]);
                    if (error) {
                        console.error("[RoleService] Error fetching user role (attempt ".concat(attempt, "):"), error);
                        lastError = error;
                        if (attempt < 2) {
                            await new Promise((resolve)=>setTimeout(resolve, 500)); // Wait before retry
                            continue;
                        }
                        // On final attempt, check if it's a "no rows" error vs connection error
                        if (error.code === 'PGRST116') {
                            console.warn('[RoleService] User profile not found - user may need to complete onboarding');
                            return 'player'; // Default role for users without profiles
                        }
                        throw error;
                    }
                    const role = (profile === null || profile === void 0 ? void 0 : profile.role) || 'player';
                    console.log('[RoleService] User role found:', role);
                    return role;
                } catch (err) {
                    lastError = err;
                    if (attempt < 2) {
                        console.warn("[RoleService] Attempt ".concat(attempt, " failed, retrying..."), err);
                        await new Promise((resolve)=>setTimeout(resolve, 500));
                        continue;
                    }
                    throw err;
                }
            }
            throw lastError;
        } catch (error) {
            console.error('[RoleService] Error getting current user role:', error);
            // For admin access, be more permissive on errors to prevent lockout
            return null;
        }
    }
    /**
   * Check if user has any of the specified roles with timeout protection
   */ static async hasRole(allowedRoles) {
        console.log('[RoleService] Checking roles:', allowedRoles);
        try {
            const userRole = await Promise.race([
                this.getCurrentUserRole(),
                new Promise((_, reject)=>setTimeout(()=>reject(new Error('Role check timeout')), 2000))
            ]);
            console.log('[RoleService] User role retrieved:', userRole);
            if (!userRole) {
                console.log('[RoleService] No user role found - redirecting to login');
                return {
                    hasAccess: false,
                    userRole: null,
                    redirectTo: '/auth/login'
                };
            }
            const hasAccess = allowedRoles.includes(userRole);
            console.log('[RoleService] Access check result:', {
                userRole,
                allowedRoles,
                hasAccess
            });
            return {
                hasAccess,
                userRole,
                redirectTo: hasAccess ? undefined : '/unauthorized'
            };
        } catch (error) {
            console.error('[RoleService] Error in hasRole check:', error);
            // For admin roles, be more permissive on timeout/error to prevent lockout
            const isAdminCheck = allowedRoles.includes('league_admin') || allowedRoles.includes('app_admin');
            if (isAdminCheck) {
                console.warn('[RoleService] Admin role check failed - failing open to prevent lockout');
                return {
                    hasAccess: true,
                    userRole: 'league_admin',
                    redirectTo: undefined
                };
            }
            return {
                hasAccess: false,
                userRole: null,
                redirectTo: '/auth/login'
            };
        }
    }
    /**
   * Check if user can access player features
   */ static async canAccessPlayerApp() {
        return this.hasRole([
            'player',
            'captain',
            'admin',
            'league_admin',
            'app_admin'
        ]);
    }
    /**
   * Check if user can access admin features
   */ static async canAccessAdminApp() {
        return this.hasRole([
            'league_admin',
            'app_admin'
        ]);
    }
    /**
   * Check if user is a league administrator
   */ static async isLeagueAdmin() {
        const result = await this.hasRole([
            'league_admin',
            'app_admin'
        ]);
        return result.hasAccess;
    }
    /**
   * Check if user is an app administrator
   */ static async isAppAdmin() {
        const result = await this.hasRole([
            'app_admin'
        ]);
        return result.hasAccess;
    }
    /**
   * Check if user can manage a specific league
   */ static async canManageLeague(leagueId) {
        try {
            const userRole = await this.getCurrentUserRole();
            if (!userRole) return false;
            // App admins can manage any league
            if (userRole === 'app_admin') {
                return true;
            }
            // League admins can manage leagues they created
            if (userRole === 'league_admin') {
                const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
                if (!user) return false;
                const { data: league } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('leagues').select('created_by').eq('id', leagueId).single();
                return (league === null || league === void 0 ? void 0 : league.created_by) === user.id;
            }
            return false;
        } catch (error) {
            console.error('Error checking league management permission:', error);
            return false;
        }
    }
    /**
   * Check if user can manage a specific team
   */ static async canManageTeam(teamId) {
        try {
            const userRole = await this.getCurrentUserRole();
            if (!userRole) return false;
            // App admins can manage any team
            if (userRole === 'app_admin') {
                return true;
            }
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) return false;
            // Team captains and admins can manage their team
            if ([
                'captain',
                'admin'
            ].includes(userRole)) {
                const { data: team } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('teams').select('captain_id').eq('id', teamId).single();
                if ((team === null || team === void 0 ? void 0 : team.captain_id) === user.id) {
                    return true;
                }
            }
            // League admins can manage teams in their leagues
            if (userRole === 'league_admin') {
                var _this;
                const { data: team } = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$player$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('teams').select('league_id, leagues!inner(created_by)').eq('id', teamId).single();
                return ((_this = team === null || team === void 0 ? void 0 : team.leagues) === null || _this === void 0 ? void 0 : _this.created_by) === user.id;
            }
            return false;
        } catch (error) {
            console.error('Error checking team management permission:', error);
            return false;
        }
    }
    /**
   * Get user role display name
   */ static getRoleDisplayName(role) {
        const roleNames = {
            player: 'Player',
            captain: 'Team Captain',
            admin: 'Team Admin',
            league_admin: 'League Administrator',
            app_admin: 'App Administrator'
        };
        return roleNames[role] || 'Unknown';
    }
    /**
   * Get role permissions description
   */ static getRolePermissions(role) {
        const permissions = {
            player: [
                'Join teams',
                'View leagues',
                'View personal stats',
                'Receive team invitations'
            ],
            captain: [
                'All player permissions',
                'Manage team roster',
                'Invite players',
                'Request league membership'
            ],
            admin: [
                'All captain permissions',
                'Manage team settings',
                'View team analytics'
            ],
            league_admin: [
                'Create and manage leagues',
                'Approve team requests',
                'Schedule matches',
                'Manage league settings'
            ],
            app_admin: [
                'All permissions',
                'Manage all users',
                'System administration',
                'Global settings'
            ]
        };
        return permissions[role] || [];
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/auth/src/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * @matchday/auth
 *
 * Shared authentication utilities for MatchDay monorepo
 */ __turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/auth.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/validator.ts [app-client] (ecmascript)");
// api-auth is app-specific, not exported from shared package
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$role$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/role.service.ts [app-client] (ecmascript)");
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/packages/auth/src/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/auth.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/validator.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$role$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/role.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/auth/src/index.ts [app-client] (ecmascript) <locals>");
}),
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
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/auth/src/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/auth/src/validator.ts [app-client] (ecmascript)");
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
            const validation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthenticationState"])();
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
                const { success, session: newSession } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["refreshAuthSession"])();
                if (success && newSession) {
                    // Validate the new session
                    const validation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthenticationState"])();
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
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$auth$2f$src$2f$validator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTokenNearExpiry"])(authState.session)) {
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

//# sourceMappingURL=_e91753b7._.js.map