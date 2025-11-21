// @ts-nocheck
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
 */
export class TeamService {
    constructor(supabaseClient) {
        this.cache = new Map();
        this.supabase = supabaseClient;
    }
    static getInstance(supabaseClient) {
        if (!TeamService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            TeamService.instance = new TeamService(supabaseClient);
        }
        else if (supabaseClient) {
            // Always update the supabase client to ensure fresh authentication context
            TeamService.instance.supabase = supabaseClient;
        }
        return TeamService.instance;
    }
    /**
     * Handle service errors consistently
     */
    handleError(error, operation) {
        console.error(`TeamService.${operation}:`, error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Cache management utilities
     */
    getCacheKey(operation, params) {
        return `team_service:${operation}:${JSON.stringify(params)}`;
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data, ttl = 300) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
     * Create a new team
     */
    async createTeam(captainId, teamData, options = { auto_add_creator: true }) {
        try {
            // First, validate that the league exists and is active
            const { data: league, error: leagueError } = await this.supabase
                .from('leagues')
                .select('*')
                .eq('id', teamData.league_id)
                .eq('is_active', true)
                .single();
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
            const { data: existingTeam, error: nameCheckError } = await this.supabase
                .from('teams')
                .select('id')
                .eq('league_id', teamData.league_id)
                .eq('name', teamData.name)
                .single();
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
                captain_id: null, // Initially null to avoid FK constraint issues
                max_players: teamData.max_players || 22,
                min_players: teamData.min_players || 7,
                is_recruiting: true,
                team_bio: teamData.description || null
            };
            const { data: newTeam, error: teamError } = await this.supabase
                .from('teams')
                .insert(teamInsert)
                .select()
                .single();
            if (teamError)
                throw teamError;
            try {
                // Step 2: Add creator as team member
                if (options.auto_add_creator) {
                    const { error: memberError } = await this.supabase
                        .from('team_members')
                        .insert({
                        team_id: newTeam.id,
                        user_id: captainId,
                        position: options.initial_position || 'midfielder',
                        jersey_number: options.initial_jersey_number || 1,
                        is_active: true
                    });
                    if (memberError)
                        throw memberError;
                }
                // Step 3: Update team with captain_id now that member exists
                const { error: updateError } = await this.supabase
                    .from('teams')
                    .update({ captain_id: captainId })
                    .eq('id', newTeam.id);
                if (updateError)
                    throw updateError;
            }
            catch (error) {
                // If any step fails, clean up the team
                await this.supabase.from('teams').delete().eq('id', newTeam.id);
                throw error;
            }
            // Return the created team data directly without complex details lookup
            // to avoid potential infinite recursion during creation
            const basicTeamData = {
                ...newTeam,
                captain_id: captainId, // Use the updated captain_id
                league: null, // Will be populated later if needed
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
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'createTeam'),
                success: false
            };
        }
    }
    /**
     * Get season year for a team by checking their actual match dates
     */
    async getTeamSeasonYear(teamId) {
        // Check if team has completed matches and get their season year
        const { data: matchYears } = await this.supabase
            .from('matches')
            .select('match_date')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .eq('status', 'completed')
            .limit(1);
        if (matchYears && matchYears.length > 0) {
            const matchYear = new Date(matchYears[0].match_date).getFullYear();
            return matchYear;
        }
        // Fallback to current year if no completed matches
        return new Date().getFullYear();
    }
    /**
     * Get all leagues this team has participated in
     */
    async getTeamLeagues(teamId) {
        try {
            // Get all leagues from team_stats (historical participation)
            const { data: leagueStats, error } = await this.supabase
                .from('team_stats')
                .select(`
          league_id,
          season_year,
          leagues!inner(id, name)
        `)
                .eq('team_id', teamId);
            if (error) {
                console.error('Error fetching team leagues:', error);
                return [];
            }
            if (!leagueStats || leagueStats.length === 0) {
                return [];
            }
            // Group by league and collect seasons
            const leaguesMap = new Map();
            leagueStats.forEach(stat => {
                if (!stat.leagues)
                    return;
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
            leagues.forEach(league => {
                league.seasons.sort((a, b) => b - a); // Latest first
                // Mark as current if it's the team's current league
                // We'll determine this in the main method
            });
            return leagues.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (error) {
            console.error('Error in getTeamLeagues:', error);
            return [];
        }
    }
    /**
     * Get detailed team information
     */
    async getTeamDetails(teamId, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getTeamDetails', { teamId });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.revalidateOnBackground) {
                return { data: cached, error: null, success: true };
            }
            // Get team with league and member details
            // Use left join for leagues since team might be orphaned
            const { data: team, error: teamError } = await this.supabase
                .from('teams')
                .select(`
          *,
          league:leagues(*),
          team_members(
            *,
            user_profile:users(*)
          )
        `)
                .eq('id', teamId)
                .single();
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
                const { data: captainProfile } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', team.captain_id)
                    .single();
                captain = captainProfile || undefined;
            }
            // Get season year for this team
            const seasonYear = await this.getTeamSeasonYear(teamId);
            // Get all leagues this team has participated in
            const teamLeagues = await this.getTeamLeagues(teamId);
            // Get team statistics
            const { data: teamStats } = await this.supabase
                .from('team_stats')
                .select('*')
                .eq('team_id', teamId)
                .eq('season_year', seasonYear)
                .single();
            // Calculate team position if stats exist and team has a league
            let stats;
            if (teamStats && team.league_id) {
                const { data: leagueTeams } = await this.supabase
                    .from('team_stats')
                    .select('team_id, points, goals_for, goals_against')
                    .eq('league_id', team.league_id)
                    .eq('season_year', seasonYear)
                    .order('points', { ascending: false });
                const position = leagueTeams?.findIndex(t => t.team_id === teamId) + 1 || 1;
                stats = {
                    wins: teamStats.wins || 0,
                    draws: teamStats.draws || 0,
                    losses: teamStats.losses || 0,
                    goals: teamStats.goals_for || 0,
                    goalsAgainst: teamStats.goals_against || 0,
                    points: teamStats.points || 0,
                    position,
                    totalTeams: leagueTeams?.length || 1
                };
            }
            else if (teamStats) {
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
            const leagues = teamLeagues.map(league => ({
                ...league,
                isCurrent: league.id === team.league_id
            }));
            const activeMembers = team.team_members?.filter((m) => m.is_active) || [];
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
            return { data: teamWithDetails, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getTeamDetails'),
                success: false
            };
        }
    }
    /**
     * Get all teams for a user (where user is a member)
     */
    async getUserTeams(userId, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getUserTeams', { userId, options });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('🔍 getUserTeams - Returning cached data for user:', userId, 'cached teams:', cached.length);
                return { data: cached, error: null, success: true };
            }
            console.log('🔍 getUserTeams - Querying team_members for user:', userId, 'includeInactive:', options.includeInactive);
            let memberQuery = this.supabase
                .from('team_members')
                .select(`
          *,
          team:teams!inner(
            *,
            league:leagues(*)
          )
        `)
                .eq('user_id', userId);
            if (!options.includeInactive) {
                memberQuery = memberQuery.eq('is_active', true);
            }
            const { data: memberships, error: memberError } = await memberQuery
                .order('joined_at', { ascending: false })
                .limit(options.limit || 50);
            console.log('🔍 getUserTeams - Query result:', {
                membershipsCount: memberships?.length || 0,
                hasError: !!memberError,
                error: memberError?.message
            });
            if (memberError)
                throw memberError;
            // PERFORMANCE OPTIMIZATION: Use embedded team data directly instead of expensive getTeamDetails calls
            // Batch fetch team stats for all teams (single query)
            const teamIds = (memberships || [])
                .filter(m => m.team)
                .map(m => m.team_id);
            let teamStatsMap = new Map();
            let memberCountsMap = new Map();
            if (teamIds.length > 0) {
                // Fetch all team stats in one query
                const { data: statsData } = await this.supabase
                    .from('team_stats')
                    .select('*')
                    .in('team_id', teamIds);
                if (statsData) {
                    statsData.forEach(stat => {
                        teamStatsMap.set(stat.team_id, stat);
                    });
                }
                // Fetch member counts in one query
                const { data: memberCounts } = await this.supabase
                    .from('team_members')
                    .select('team_id')
                    .in('team_id', teamIds);
                if (memberCounts) {
                    memberCounts.forEach(member => {
                        const count = memberCountsMap.get(member.team_id) || 0;
                        memberCountsMap.set(member.team_id, count + 1);
                    });
                }
            }
            const teams = (memberships || []).map((membership) => {
                if (!membership.team) {
                    return null;
                }
                const stats = teamStatsMap.get(membership.team_id);
                const memberCount = memberCountsMap.get(membership.team_id) || 1;
                // Create TeamWithDetails from embedded data with actual stats
                const teamWithDetails = {
                    // Core team data (all available from the initial query)
                    id: membership.team.id,
                    name: membership.team.name,
                    description: membership.team.description || '',
                    team_color: membership.team.team_color,
                    team_bio: membership.team.team_bio || '',
                    max_players: membership.team.max_players || 22,
                    logo_url: membership.team.logo_url,
                    logo_media_id: membership.team.logo_media_id,
                    captain_id: membership.team.captain_id,
                    league_id: membership.team.league_id,
                    is_active: membership.team.is_active ?? true,
                    created_at: membership.team.created_at,
                    updated_at: membership.team.updated_at,
                    // League information (already included in query via join)
                    league: membership.team.league,
                    // Simplified member information for team listing
                    captain: null, // Skip captain lookup for performance
                    members: [], // Skip member list for team listing
                    memberCount,
                    availableSpots: Math.max(0, (membership.team.max_players || 22) - memberCount),
                    // Status flags
                    isOrphaned: !membership.team.league_id,
                    // Include actual stats from batch fetch
                    stats: stats || undefined,
                    joinRequests: undefined
                };
                return teamWithDetails;
            });
            const validTeams = teams.filter((team) => team !== null);
            // Cache for 5 minutes
            this.setCache(cacheKey, validTeams, 300);
            return { data: validTeams, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getUserTeams'),
                success: false
            };
        }
    }
    /**
     * Update team information
     */
    async updateTeam(teamId, captainId, updates) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase
                .from('teams')
                .select('captain_id')
                .eq('id', teamId)
                .single();
            if (verifyError)
                throw verifyError;
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
            const { data: updatedTeam, error: updateError } = await this.supabase
                .from('teams')
                .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
                .eq('id', teamId)
                .select()
                .single();
            if (updateError)
                throw updateError;
            // Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            return { data: updatedTeam, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'updateTeam'),
                success: false
            };
        }
    }
    /**
     * Find league by sport and location for team creation
     */
    async findLeagueByName(sport, leagueName) {
        try {
            const { data: league, error } = await this.supabase
                .from('leagues')
                .select('*')
                .eq('sport_type', sport.toLowerCase())
                .eq('name', leagueName)
                .eq('is_active', true)
                .eq('is_public', true)
                .single();
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
            return { data: league, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'findLeagueByName'),
                success: false
            };
        }
    }
    /**
     * Search teams across leagues
     */
    async searchTeams(options = {}) {
        try {
            let query = this.supabase
                .from('teams')
                .select(`
          *,
          league:leagues!inner(*)
        `, { count: 'exact' })
                .eq('league.is_active', true)
                .eq('league.is_public', true);
            if (options.query) {
                query = query.or(`name.ilike.%${options.query}%,team_bio.ilike.%${options.query}%`);
            }
            if (options.sport) {
                query = query.eq('league.sport_type', options.sport.toLowerCase());
            }
            if (options.location) {
                query = query.ilike('league.location', `%${options.location}%`);
            }
            if (options.hasAvailableSpots) {
                query = query.eq('is_recruiting', true);
            }
            const { data: teams, error, count } = await query
                .order('created_at', { ascending: false })
                .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error)
                throw error;
            // Get detailed information for each team
            const teamPromises = (teams || []).map(async (team) => {
                const teamDetails = await this.getTeamDetails(team.id);
                return teamDetails.data;
            });
            const detailedTeams = await Promise.all(teamPromises);
            const validTeams = detailedTeams.filter((team) => team !== null);
            // Filter by available spots if requested
            const filteredTeams = options.hasAvailableSpots
                ? validTeams.filter(team => team.availableSpots > 0)
                : validTeams;
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: filteredTeams,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
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
     */
    subscribeToTeamUpdates(teamId, callback, options = { table: 'teams', event: '*' }) {
        return this.supabase
            .channel(`team-${teamId}-updates`)
            .on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || `id=eq.${teamId}`
        }, callback)
            .subscribe();
    }
    /**
     * Clear cache for specific operations or all cache
     */
    clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach(key => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    /**
     * Get all orphaned teams (teams without a league)
     */
    async getOrphanedTeams(options = {}) {
        try {
            let query = this.supabase
                .from('teams')
                .select(`
          *,
          league:leagues(*),
          team_members(
            *,
            user_profile:users(*)
          )
        `, { count: 'exact' })
                .is('league_id', null);
            if (!options.includeArchived) {
                query = query.eq('is_archived', false);
            }
            const { data: teams, error, count } = await query
                .order('updated_at', { ascending: false })
                .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error)
                throw error;
            // Get detailed information for each team
            const teamPromises = (teams || []).map(async (team) => {
                const teamDetails = await this.getTeamDetails(team.id);
                return teamDetails.data;
            });
            const detailedTeams = await Promise.all(teamPromises);
            const validTeams = detailedTeams.filter((team) => team !== null);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: validTeams,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
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
     */
    async reassignTeamToLeague(teamId, newLeagueId, userId) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase
                .from('teams')
                .select('captain_id, name, league_id')
                .eq('id', teamId)
                .single();
            if (verifyError)
                throw verifyError;
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
            const { data: league, error: leagueError } = await this.supabase
                .from('leagues')
                .select('*')
                .eq('id', newLeagueId)
                .eq('is_active', true)
                .single();
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
            const { data: existingTeam, error: nameCheckError } = await this.supabase
                .from('teams')
                .select('id')
                .eq('league_id', newLeagueId)
                .eq('name', team.name)
                .neq('id', teamId)
                .single();
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
            const { data: updatedTeam, error: updateError } = await this.supabase
                .from('teams')
                .update({
                league_id: newLeagueId,
                previous_league_name: null,
                is_archived: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', teamId)
                .select()
                .single();
            if (updateError)
                throw updateError;
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
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'reassignTeamToLeague'),
                success: false
            };
        }
    }
    /**
     * Archive an orphaned team
     */
    async archiveTeam(teamId, userId) {
        try {
            // Verify the user is the team captain
            const { data: team, error: verifyError } = await this.supabase
                .from('teams')
                .select('captain_id')
                .eq('id', teamId)
                .single();
            if (verifyError)
                throw verifyError;
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
            const { data: archivedTeam, error: updateError } = await this.supabase
                .from('teams')
                .update({
                is_archived: true,
                is_recruiting: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', teamId)
                .select()
                .single();
            if (updateError)
                throw updateError;
            // Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            this.clearCache('getOrphanedTeams');
            return { data: archivedTeam, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'archiveTeam'),
                success: false
            };
        }
    }
    /**
     * Remove a team member (captain only, soft delete with archival)
     *
     * @param teamId - The ID of the team
     * @param memberId - The ID of the team_members record to remove
     * @param captainId - The ID of the user performing the removal (must be captain)
     * @param reason - Optional reason for removal
     * @returns ServiceResponse with the removed member data
     */
    async removeTeamMember(teamId, memberId, captainId, reason) {
        try {
            console.log('TeamService.removeTeamMember - Starting:', { teamId, memberId, captainId });
            // 1. Verify the captain authorization
            const { data: team, error: teamError } = await this.supabase
                .from('teams')
                .select('captain_id')
                .eq('id', teamId)
                .single();
            if (teamError) {
                console.error('TeamService.removeTeamMember - Team lookup error:', teamError);
                throw new Error('Team not found');
            }
            if (team.captain_id !== captainId) {
                console.error('TeamService.removeTeamMember - Authorization failed: not the captain');
                return {
                    data: null,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Only the team captain can remove members',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 2. Get the member to be removed
            const { data: member, error: memberError } = await this.supabase
                .from('team_members')
                .select('*')
                .eq('id', memberId)
                .eq('team_id', teamId)
                .is('removed_at', null) // Only get members who haven't been removed yet
                .single();
            if (memberError || !member) {
                console.error('TeamService.removeTeamMember - Member lookup error:', memberError);
                // Provide more helpful error message
                const errorMsg = memberError?.message?.includes('multiple')
                    ? 'Multiple members found with this ID'
                    : memberError?.code === 'PGRST116'
                        ? 'Team member not found or already removed'
                        : 'Team member not found';
                return {
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: errorMsg,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 3. Prevent captain from removing themselves
            if (member.user_id === captainId) {
                console.error('TeamService.removeTeamMember - Captain cannot remove self');
                return {
                    data: null,
                    error: {
                        code: 'INVALID_OPERATION',
                        message: 'Captains cannot remove themselves. Please transfer captaincy first.',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 4. Check if this is the last member (prevent orphaned team)
            const { count, error: countError } = await this.supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('is_active', true)
                .is('removed_at', null);
            if (countError) {
                console.error('TeamService.removeTeamMember - Count error:', countError);
                throw countError;
            }
            if (count && count <= 1) {
                console.error('TeamService.removeTeamMember - Cannot remove last member');
                return {
                    data: null,
                    error: {
                        code: 'INVALID_OPERATION',
                        message: 'Cannot remove the last team member',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 5. Perform soft delete (archival)
            const now = new Date().toISOString();
            const { data: removedMember, error: updateError } = await this.supabase
                .from('team_members')
                .update({
                removed_at: now,
                removed_by: captainId,
                removal_reason: reason || null,
                is_active: false
            })
                .eq('id', memberId)
                .select()
                .single();
            if (updateError) {
                console.error('TeamService.removeTeamMember - Update error:', updateError);
                throw updateError;
            }
            console.log('TeamService.removeTeamMember - Successfully removed member:', memberId);
            // 6. Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            return {
                data: removedMember,
                error: null,
                success: true
            };
        }
        catch (error) {
            console.error('TeamService.removeTeamMember - Error:', error);
            return {
                data: null,
                error: this.handleError(error, 'removeTeamMember'),
                success: false
            };
        }
    }
    /**
     * Transfer team captaincy to another active member
     *
     * @param teamId - The ID of the team
     * @param currentCaptainId - The ID of the current captain
     * @param newCaptainId - The ID of the new captain (must be active member)
     * @returns ServiceResponse with the updated team data
     */
    async transferCaptaincy(teamId, currentCaptainId, newCaptainId) {
        try {
            console.log('TeamService.transferCaptaincy - Starting:', { teamId, currentCaptainId, newCaptainId });
            // 1. Verify current captain authorization
            const { data: team, error: teamError } = await this.supabase
                .from('teams')
                .select('captain_id')
                .eq('id', teamId)
                .single();
            if (teamError || !team) {
                console.error('TeamService.transferCaptaincy - Team lookup error:', teamError);
                return {
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Team not found',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            if (team.captain_id !== currentCaptainId) {
                console.error('TeamService.transferCaptaincy - Authorization failed: not the captain');
                return {
                    data: null,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Only the current captain can transfer captaincy',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 2. Verify new captain is an active member
            const { data: newCaptainMember, error: memberError } = await this.supabase
                .from('team_members')
                .select('*')
                .eq('team_id', teamId)
                .eq('user_id', newCaptainId)
                .eq('is_active', true)
                .is('removed_at', null)
                .single();
            if (memberError || !newCaptainMember) {
                console.error('TeamService.transferCaptaincy - New captain not found or inactive:', memberError);
                return {
                    data: null,
                    error: {
                        code: 'INVALID_MEMBER',
                        message: 'New captain must be an active team member',
                        timestamp: new Date().toISOString()
                    },
                    success: false
                };
            }
            // 3. Update team captain
            const { data: updatedTeam, error: updateError } = await this.supabase
                .from('teams')
                .update({
                captain_id: newCaptainId,
                updated_at: new Date().toISOString()
            })
                .eq('id', teamId)
                .select()
                .single();
            if (updateError) {
                console.error('TeamService.transferCaptaincy - Update error:', updateError);
                throw updateError;
            }
            console.log('TeamService.transferCaptaincy - Successfully transferred captaincy to:', newCaptainId);
            // 4. Clear caches
            this.clearCache('getTeamDetails');
            this.clearCache('getUserTeams');
            return {
                data: updatedTeam,
                error: null,
                success: true
            };
        }
        catch (error) {
            console.error('TeamService.transferCaptaincy - Error:', error);
            return {
                data: null,
                error: this.handleError(error, 'transferCaptaincy'),
                success: false
            };
        }
    }
}
//# sourceMappingURL=team.service.js.map