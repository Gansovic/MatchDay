(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/layout/header.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const Header = (param)=>{
    let { className = '' } = param;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const navItems = [
        {
            href: '/',
            label: 'Home',
            icon: '🏠'
        },
        {
            href: '/demo-dashboard',
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ".concat(className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between h-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "flex items-center space-x-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white font-bold text-sm",
                                    children: "M"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/layout/header.tsx",
                                    lineNumber: 43,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/header.tsx",
                                lineNumber: 42,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                                children: "MatchDay"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/header.tsx",
                                lineNumber: 45,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/header.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "hidden md:flex items-center space-x-1",
                        children: navItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ".concat(isActive(item.href) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-lg",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/header.tsx",
                                        lineNumber: 62,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium",
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/header.tsx",
                                        lineNumber: 63,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, item.href, true, {
                                fileName: "[project]/src/components/layout/header.tsx",
                                lineNumber: 53,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/src/components/layout/header.tsx",
                        lineNumber: 51,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-4",
                        children: [
                            !pathname.includes('/dashboard') && !pathname.includes('/demo-dashboard') && !pathname.includes('/profile') && !pathname.includes('/leagues') && !pathname.includes('/teams') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/demo-dashboard",
                                className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors",
                                children: "Get Started"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/header.tsx",
                                lineNumber: 72,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "md:hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-1",
                                    children: navItems.slice(1).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            className: "p-2 rounded-lg transition-colors ".concat(isActive(item.href) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xl",
                                                children: item.icon
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/header.tsx",
                                                lineNumber: 93,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, item.href, false, {
                                            fileName: "[project]/src/components/layout/header.tsx",
                                            lineNumber: 84,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/layout/header.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/header.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/header.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/header.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/layout/header.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/layout/header.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Header, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/providers/query-provider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const QueryProvider = (param)=>{
    let { children } = param;
    _s();
    const [queryClient] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState({
        "QueryProvider.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1
                    }
                }
            })
    }["QueryProvider.useState"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/providers/query-provider.tsx",
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
"[project]/src/lib/services/edge-functions.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0); // Will be injected
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(EdgeFunctionsService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/auth/auth.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/edge-functions.service.ts [app-client] (ecmascript)");
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
            const { data: profile } = await this.supabase.from('user_profiles').select('*').eq('id', user.id).single();
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
                const profileResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdgeFunctionsService"].getInstance().updateUserProfile({
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
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$edge$2d$functions$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdgeFunctionsService"].getInstance().updateUserProfile(updates);
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "supabase", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentUser", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentSession", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "listeners", []);
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(AuthService, "instance", void 0);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/loading-dialog.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Loading Dialog Component for MatchDay
 * 
 * Adapted from TravelBuddies LEVER principles for professional loading states.
 * Provides consistent loading experience across the application.
 * 
 * @example
 * ```typescript
 * await LoadingDialog.show({
 *   title: 'Creating League',
 *   message: 'Setting up your league...',
 *   operation: () => EdgeFunctionsService.getInstance().createLeague(data),
 * });
 * ```
 * 
 * This component should be used for ALL loading states.
 */ __turbopack_context__.s({
    "LoadingDialog": ()=>LoadingDialog
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/client.js [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
;
;
const LoadingDialogComponent = (param)=>{
    let { title, message, estimatedDuration, progress, onCancel } = param;
    _s();
    const [currentProgress, setCurrentProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(progress || 0);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "LoadingDialogComponent.useEffect": ()=>{
            if (estimatedDuration && !progress) {
                const interval = setInterval({
                    "LoadingDialogComponent.useEffect.interval": ()=>{
                        setCurrentProgress({
                            "LoadingDialogComponent.useEffect.interval": (prev)=>{
                                if (prev >= 90) return prev;
                                return prev + (100 - prev) * 0.1;
                            }
                        }["LoadingDialogComponent.useEffect.interval"]);
                    }
                }["LoadingDialogComponent.useEffect.interval"], estimatedDuration / 100);
                return ({
                    "LoadingDialogComponent.useEffect": ()=>clearInterval(interval)
                })["LoadingDialogComponent.useEffect"];
            }
        }
    }["LoadingDialogComponent.useEffect"], [
        estimatedDuration,
        progress
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "LoadingDialogComponent.useEffect": ()=>{
            if (progress !== undefined) {
                setCurrentProgress(progress);
            }
        }
    }["LoadingDialogComponent.useEffect"], [
        progress
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-16 h-16 mx-auto mb-4 relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/loading-dialog.tsx",
                                    lineNumber: 72,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/loading-dialog.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/loading-dialog.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-xl font-semibold text-gray-900 dark:text-white mb-2",
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/loading-dialog.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 dark:text-gray-300",
                            children: message
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/loading-dialog.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ui/loading-dialog.tsx",
                    lineNumber: 70,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out",
                                style: {
                                    width: "".concat(currentProgress, "%")
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/loading-dialog.tsx",
                                lineNumber: 87,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/loading-dialog.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-500 dark:text-gray-400 text-center mt-2",
                            children: [
                                Math.round(currentProgress),
                                "% complete"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/loading-dialog.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ui/loading-dialog.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                onCancel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onCancel,
                        className: "px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors",
                        children: "Cancel"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/loading-dialog.tsx",
                        lineNumber: 100,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/loading-dialog.tsx",
                    lineNumber: 99,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ui/loading-dialog.tsx",
            lineNumber: 68,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/ui/loading-dialog.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(LoadingDialogComponent, "P8ts5WyclRvx+h5cqrva9Ssmgt4=");
_c = LoadingDialogComponent;
class LoadingDialogService {
    static getInstance() {
        if (!LoadingDialogService.instance) {
            LoadingDialogService.instance = new LoadingDialogService();
        }
        return LoadingDialogService.instance;
    }
    async show(param) {
        let { title, message, estimatedDuration = 3000, operation, onProgress } = param;
        return new Promise((resolve, reject)=>{
            // Create dialog container
            this.currentDialog = document.createElement('div');
            document.body.appendChild(this.currentDialog);
            this.currentRoot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createRoot"])(this.currentDialog);
            let cancelled = false;
            let progress = 0;
            const handleCancel = ()=>{
                cancelled = true;
                this.hide();
                reject(new Error('Operation cancelled'));
            };
            const updateProgress = (newProgress)=>{
                progress = newProgress;
                if (onProgress) onProgress(newProgress);
                this.render({
                    title,
                    message,
                    estimatedDuration,
                    progress,
                    onCancel: handleCancel
                });
            };
            // Initial render
            this.render({
                title,
                message,
                estimatedDuration,
                progress,
                onCancel: handleCancel
            });
            // Execute operation
            operation().then((result)=>{
                if (!cancelled) {
                    updateProgress(100);
                    setTimeout(()=>{
                        this.hide();
                        resolve(result);
                    }, 300);
                }
            }).catch((error)=>{
                if (!cancelled) {
                    this.hide();
                    reject(error);
                }
            });
        });
    }
    render(props) {
        if (this.currentRoot) {
            this.currentRoot.render(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingDialogComponent, {
                ...props
            }, void 0, false, {
                fileName: "[project]/src/components/ui/loading-dialog.tsx",
                lineNumber: 179,
                columnNumber: 31
            }, this));
        }
    }
    hide() {
        if (this.currentRoot) {
            this.currentRoot.unmount();
            this.currentRoot = null;
        }
        if (this.currentDialog) {
            document.body.removeChild(this.currentDialog);
            this.currentDialog = null;
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentDialog", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentRoot", null);
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(LoadingDialogService, "instance", void 0);
const LoadingDialog = LoadingDialogService.getInstance();
var _c;
__turbopack_context__.k.register(_c, "LoadingDialogComponent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/auth/auth-provider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/**
 * Authentication Provider Component
 * 
 * React context provider that manages authentication state across the application.
 * Follows LEVER principles by providing centralized auth state management.
 * 
 * @example
 * ```typescript
 * <AuthProvider supabaseClient={supabase}>
 *   <App />
 * </AuthProvider>
 * 
 * // In components:
 * const { user, signIn, signOut, isLoading } = useAuth();
 * ```
 */ __turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth,
    "useRequireAuth": ()=>useRequireAuth,
    "withAuth": ()=>withAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/auth.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$loading$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/loading-dialog.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const AuthProvider = (param)=>{
    let { children, supabaseClient } = param;
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const authService = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].getInstance();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Initialize auth service with Supabase client
            authService.setSupabaseClient(supabaseClient);
            // Subscribe to auth state changes
            const unsubscribe = authService.onAuthStateChange({
                "AuthProvider.useEffect.unsubscribe": (user)=>{
                    setUser(user);
                    setIsLoading(false);
                }
            }["AuthProvider.useEffect.unsubscribe"]);
            // Initial user check
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
            return unsubscribe;
        }
    }["AuthProvider.useEffect"], [
        supabaseClient
    ]);
    const signUp = async (data)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$loading$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingDialog"].show({
                title: 'Creating Account',
                message: 'Setting up your player profile...',
                operation: ()=>authService.signUp(data)
            });
            if (result.error) {
                return {
                    success: false,
                    error: result.error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create account'
            };
        }
    };
    const signIn = async (data)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$loading$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingDialog"].show({
                title: 'Signing In',
                message: 'Authenticating your account...',
                operation: ()=>authService.signIn(data)
            });
            if (result.error) {
                return {
                    success: false,
                    error: result.error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign in'
            };
        }
    };
    const signInWithOAuth = async (provider)=>{
        try {
            const result = await authService.signInWithOAuth(provider);
            if (result.error) {
                return {
                    success: false,
                    error: result.error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign in'
            };
        }
    };
    const signOut = async ()=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$loading$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingDialog"].show({
                title: 'Signing Out',
                message: 'Ending your session...',
                operation: ()=>authService.signOut()
            });
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
    const updateProfile = async (updates)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$loading$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingDialog"].show({
                title: 'Updating Profile',
                message: 'Saving your changes...',
                operation: ()=>authService.updateProfile(updates)
            });
            if (result.error) {
                return {
                    success: false,
                    error: result.error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update profile'
            };
        }
    };
    const resetPassword = async (email)=>{
        try {
            const result = await authService.resetPassword(email);
            if (result.error) {
                return {
                    success: false,
                    error: result.error.message
                };
            }
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send reset email'
            };
        }
    };
    const hasPermission = (permission)=>{
        return authService.hasPermission(permission);
    };
    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        updateProfile,
        resetPassword,
        hasPermission
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/auth/auth-provider.tsx",
        lineNumber: 232,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "YajQB7LURzRD+QP5gw0+K2TZIWA=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const withAuth = (Component)=>{
    var _s = __turbopack_context__.k.signature();
    return _s(function AuthenticatedComponent(props) {
        _s();
        const { user, isLoading } = useAuth();
        if (isLoading) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/auth-provider.tsx",
                    lineNumber: 256,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/auth/auth-provider.tsx",
                lineNumber: 255,
                columnNumber: 9
            }, this);
        }
        if (!user) {
            // Redirect to sign in page or show sign in modal
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-gray-900 mb-4",
                            children: "Authentication Required"
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/auth-provider.tsx",
                            lineNumber: 266,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-8",
                            children: "Please sign in to access this page."
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/auth-provider.tsx",
                            lineNumber: 269,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/auth/auth-provider.tsx",
                    lineNumber: 265,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/auth/auth-provider.tsx",
                lineNumber: 264,
                columnNumber: 9
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/auth/auth-provider.tsx",
            lineNumber: 278,
            columnNumber: 12
        }, this);
    }, "6lKHjqCqGIRsHh92bje8H78laow=", false, function() {
        return [
            useAuth
        ];
    });
};
const useRequireAuth = ()=>{
    _s2();
    const { user, isLoading } = useAuth();
    if (isLoading) {
        throw new Promise(()=>{}); // Suspend until loading is complete
    }
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
};
_s2(useRequireAuth, "6lKHjqCqGIRsHh92bje8H78laow=", false, function() {
    return [
        useAuth
    ];
});
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_bb395a74._.js.map