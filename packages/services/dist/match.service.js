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
 */
export class MatchService {
    constructor(supabaseClient) {
        this.cache = new Map();
        this.supabase = supabaseClient;
    }
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
     */
    handleError(error, operation) {
        console.error(`MatchService.${operation}:`, error);
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
        return `match_service:${operation}:${JSON.stringify(params)}`;
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
     * Get player's matches with detailed information
     */
    async getPlayerMatches(userId, filters = {}, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getPlayerMatches', { userId, filters, options });
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
            const { data: userTeams, error: teamsError } = await this.supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId)
                .eq('is_active', true);
            if (teamsError)
                throw teamsError;
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
            const teamIds = userTeams.map(tm => tm.team_id);
            // Build match query
            let query = this.supabase
                .from('matches')
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!inner(*)
        `, { count: 'exact' })
                .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`);
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
                query = query.ilike('venue', `%${filters.venue}%`);
            }
            if (!options.includeFutureMatches) {
                query = query.lte('scheduled_date', new Date().toISOString());
            }
            const { data: matches, error, count } = await query
                .order('scheduled_date', { ascending: false })
                .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error)
                throw error;
            // Get match events and stats for each match
            const matchesWithDetails = await Promise.all((matches || []).map(async (match) => {
                // Get match events
                const { data: events, error: eventsError } = await this.supabase
                    .from('match_events')
                    .select('*')
                    .eq('match_id', match.id)
                    .order('event_time', { ascending: true });
                if (eventsError)
                    throw eventsError;
                // Get team players
                const { data: homePlayers, error: homeError } = await this.supabase
                    .from('team_members')
                    .select(`
              user_id,
              position,
              jersey_number,
              users!inner(*)
            `)
                    .eq('team_id', match.home_team_id)
                    .eq('is_active', true);
                const { data: awayPlayers, error: awayError } = await this.supabase
                    .from('team_members')
                    .select(`
              user_id,
              position,
              jersey_number,
              users!inner(*)
            `)
                    .eq('team_id', match.away_team_id)
                    .eq('is_active', true);
                if (homeError)
                    throw homeError;
                if (awayError)
                    throw awayError;
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
                    homeTeamPlayers: (homePlayers || []).map(p => p.users),
                    awayTeamPlayers: (awayPlayers || []).map(p => p.users),
                    playerStats: playerStats ? [playerStats] : undefined
                };
            }));
            // Cache for 2 minutes (shorter for live data)
            this.setCache(cacheKey, matchesWithDetails, 120);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: matchesWithDetails,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
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
     */
    async getMatchDetails(matchId, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getMatchDetails', { matchId, includeAnalytics: options.includeAnalytics });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.userId) {
                return { data: cached, error: null, success: true };
            }
            // Get match with complete details
            const { data: match, error: matchError } = await this.supabase
                .from('matches')
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!inner(*),
          match_events(*)
        `)
                .eq('id', matchId)
                .single();
            if (matchError) {
                if (matchError.code === 'PGRST116') {
                    return {
                        data: null,
                        error: { code: 'MATCH_NOT_FOUND', message: 'Match not found', timestamp: new Date().toISOString() },
                        success: false
                    };
                }
                throw matchError;
            }
            // Get team players with profiles
            const [homePlayers, awayPlayers] = await Promise.all([
                this.supabase
                    .from('team_members')
                    .select(`
            user_id,
            position,
            jersey_number,
            users!inner(*)
          `)
                    .eq('team_id', match.home_team_id)
                    .eq('is_active', true),
                this.supabase
                    .from('team_members')
                    .select(`
            user_id,
            position,
            jersey_number,
            users!inner(*)
          `)
                    .eq('team_id', match.away_team_id)
                    .eq('is_active', true)
            ]);
            if (homePlayers.error)
                throw homePlayers.error;
            if (awayPlayers.error)
                throw awayPlayers.error;
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
                homeTeamPlayers: (homePlayers.data || []).map(p => p.users),
                awayTeamPlayers: (awayPlayers.data || []).map(p => p.users),
                playerStats: playerStats ? [playerStats] : undefined
            };
            const result = {
                ...matchWithDetails,
                analytics: analytics?.data || undefined
            };
            // Cache if not user-specific
            if (!options.userId) {
                this.setCache(cacheKey, result, match.status === 'live' ? 30 : 600);
            }
            return { data: result, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchDetails'),
                success: false
            };
        }
    }
    /**
     * Get live match data with real-time updates
     */
    async getLiveMatchData(matchId) {
        try {
            // Get match details first
            const matchResponse = await this.getMatchDetails(matchId, { includeAnalytics: true });
            if (!matchResponse.success || !matchResponse.data) {
                throw new Error('Match not found');
            }
            const match = matchResponse.data;
            // Get recent events (last 10 minutes)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const { data: recentEvents, error: eventsError } = await this.supabase
                .from('match_events')
                .select('*')
                .eq('match_id', matchId)
                .gte('created_at', tenMinutesAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);
            if (eventsError)
                throw eventsError;
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
            return { data: liveMatchData, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getLiveMatchData'),
                success: false
            };
        }
    }
    /**
     * Get active/live matches
     */
    async getActiveMatches(filters = {}, limit = 50) {
        try {
            const cacheKey = this.getCacheKey('getActiveMatches', { filters, limit });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return { data: cached, error: null, success: true };
            }
            let query = this.supabase
                .from('active_matches')
                .select('*')
                .limit(limit);
            if (filters.leagueId) {
                query = query.eq('league_id', filters.leagueId);
            }
            if (filters.sportType) {
                query = query.eq('sport_type', filters.sportType);
            }
            const { data: activeMatches, error } = await query;
            if (error)
                throw error;
            // Cache for 1 minute (short cache for live data)
            this.setCache(cacheKey, activeMatches || [], 60);
            return { data: activeMatches || [], error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getActiveMatches'),
                success: false
            };
        }
    }
    /**
     * Get match predictions based on team and player statistics
     */
    async getMatchPrediction(matchId) {
        try {
            const cacheKey = this.getCacheKey('getMatchPrediction', { matchId });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return { data: cached, error: null, success: true };
            }
            // Get match details
            const matchResponse = await this.getMatchDetails(matchId);
            if (!matchResponse.success || !matchResponse.data) {
                throw new Error('Match not found');
            }
            const match = matchResponse.data;
            // Get team statistics
            const [homeTeamStats, awayTeamStats] = await Promise.all([
                this.supabase
                    .from('team_stats')
                    .select('*')
                    .eq('team_id', match.homeTeam.id)
                    .eq('league_id', match.league_id)
                    .single(),
                this.supabase
                    .from('team_stats')
                    .select('*')
                    .eq('team_id', match.awayTeam.id)
                    .eq('league_id', match.league_id)
                    .single()
            ]);
            // Calculate prediction probabilities using simple algorithm
            const prediction = this.calculateMatchPrediction(homeTeamStats.data, awayTeamStats.data, match);
            // Cache for 24 hours
            this.setCache(cacheKey, prediction, 86400);
            return { data: prediction, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchPrediction'),
                success: false
            };
        }
    }
    /**
     * Get player's performance metrics for a specific match
     */
    async getPlayerMatchPerformance(matchId, playerId) {
        try {
            const cacheKey = this.getCacheKey('getPlayerMatchPerformance', { matchId, playerId });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return { data: cached, error: null, success: true };
            }
            const playerStats = await this.calculateMatchPlayerStats(matchId, playerId);
            if (!playerStats) {
                return {
                    data: null,
                    error: { code: 'PLAYER_NOT_IN_MATCH', message: 'Player not found in this match', timestamp: new Date().toISOString() },
                    success: false
                };
            }
            // Cache for 30 minutes
            this.setCache(cacheKey, playerStats, 1800);
            return { data: playerStats, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerMatchPerformance'),
                success: false
            };
        }
    }
    /**
     * Private helper methods
     */
    async calculateMatchPlayerStats(matchId, playerId) {
        // Get player profile
        const { data: player, error: playerError } = await this.supabase
            .from('users')
            .select('display_name')
            .eq('id', playerId)
            .single();
        if (playerError || !player)
            return null;
        // Get player's events in this match
        const { data: events, error: eventsError } = await this.supabase
            .from('match_events')
            .select('*')
            .eq('match_id', matchId)
            .eq('player_id', playerId)
            .order('event_time', { ascending: true });
        if (eventsError)
            return null;
        // Calculate stats from events
        const stats = (events || []).reduce((acc, event) => {
            switch (event.event_type) {
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
            rating: Math.min(10, Math.max(1, 5 + (stats.goals * 2) + (stats.assists * 1.5) - (stats.yellowCards * 0.5) - (stats.redCards * 2))),
            keyPasses: 0, // Would need more detailed event tracking
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
            minutesPlayed: 90, // Simplified - would need substitution tracking
            events: events || [],
            performance
        };
    }
    async calculateLiveStats(matchId) {
        try {
            // Get all match events
            const { data: events, error } = await this.supabase
                .from('match_events')
                .select('*')
                .eq('match_id', matchId);
            if (error)
                throw error;
            const homeTeamStats = {};
            const awayTeamStats = {};
            const playerStats = {};
            // Process events to calculate live stats
            (events || []).forEach(event => {
                // Team stats
                const isHomeTeam = event.team_id === 'home'; // This would need proper team ID checking
                const teamStats = isHomeTeam ? homeTeamStats : awayTeamStats;
                teamStats[event.event_type] = (teamStats[event.event_type] || 0) + 1;
                // Player stats
                if (event.player_id) {
                    if (!playerStats[event.player_id]) {
                        playerStats[event.player_id] = {};
                    }
                    playerStats[event.player_id][event.event_type] =
                        (playerStats[event.player_id][event.event_type] || 0) + 1;
                }
            });
            return {
                data: { homeTeamStats, awayTeamStats, playerStats },
                error: null,
                success: true
            };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculateLiveStats'),
                success: false
            };
        }
    }
    async generateMatchAnalytics(matchId) {
        try {
            const { data: match, error: matchError } = await this.supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .single();
            if (matchError)
                throw matchError;
            const { data: events, error: eventsError } = await this.supabase
                .from('match_events')
                .select('*')
                .eq('match_id', matchId)
                .order('event_time', { ascending: true });
            if (eventsError)
                throw eventsError;
            // Calculate analytics
            const analytics = {
                matchId,
                duration: match.match_duration || 90,
                totalEvents: events?.length || 0,
                goalsByPeriod: this.calculateGoalsByPeriod(events || []),
                cardsByTeam: this.calculateCardsByTeam(events || []),
                topPerformers: {
                    home: [],
                    away: []
                },
                matchMomentum: this.calculateMatchMomentum(events || [])
            };
            return { data: analytics, error: null, success: true };
        }
        catch (error) {
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
        const homeWinProbability = Math.round(((homeForm + 0.1) / totalStrength) * 100);
        const awayWinProbability = Math.round(((awayForm + 0.1) / totalStrength) * 100);
        const drawProbability = 100 - homeWinProbability - awayWinProbability;
        return {
            matchId: match.id,
            homeWinProbability,
            drawProbability,
            awayWinProbability,
            expectedGoalsHome: Number(homeAttack.toFixed(1)),
            expectedGoalsAway: Number(awayAttack.toFixed(1)),
            keyFactors: [
                `${match.homeTeam.name} home advantage`,
                `Recent form comparison`,
                `Head-to-head record`
            ],
            confidence: 75
        };
    }
    calculateGoalsByPeriod(events) {
        return events.reduce((acc, event) => {
            if (event.event_type === 'goal' && event.event_time !== null) {
                if (event.event_time <= 45) {
                    // Would need team determination logic
                    acc.firstHalf.home++;
                }
                else if (event.event_time <= 90) {
                    acc.secondHalf.home++;
                }
            }
            return acc;
        }, {
            firstHalf: { home: 0, away: 0 },
            secondHalf: { home: 0, away: 0 }
        });
    }
    calculateCardsByTeam(events) {
        return {
            home: { yellow: 0, red: 0 },
            away: { yellow: 0, red: 0 }
        };
    }
    calculateMatchMomentum(events) {
        return events.map((event, index) => ({
            minute: event.event_time || 0,
            homeScore: 0, // Would need proper score tracking
            awayScore: 0,
            eventType: event.event_type,
            momentum: 0 // Would need momentum calculation algorithm
        }));
    }
    /**
     * Subscribe to real-time match updates
     */
    subscribeToMatchUpdates(matchId, callback, options = { table: 'match_events', event: '*' }) {
        return this.supabase
            .channel(`match-${matchId}-updates`)
            .on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || `match_id=eq.${matchId}`
        }, callback)
            .subscribe();
    }
    /**
     * Create a new match between two teams
     */
    async createMatch(data) {
        try {
            console.log('🏟️ MatchService.createMatch:', data);
            // Validate teams exist and are different
            const { data: teams, error: teamsError } = await this.supabase
                .from('teams')
                .select('id, name')
                .in('id', [data.homeTeamId, data.awayTeamId]);
            if (teamsError)
                throw teamsError;
            if (!teams || teams.length !== 2) {
                return {
                    data: null,
                    error: { code: 'INVALID_TEAMS', message: 'One or both teams do not exist', timestamp: new Date().toISOString() },
                    success: false
                };
            }
            // Create the match
            const { data: match, error: matchError } = await this.supabase
                .from('matches')
                .insert({
                home_team_id: data.homeTeamId,
                away_team_id: data.awayTeamId,
                match_date: data.matchDate,
                scheduled_date: data.matchDate,
                venue: data.venue || 'TBD',
                league_id: data.leagueId || null,
                match_type: data.matchType || 'friendly',
                status: 'scheduled'
            })
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues(*)
        `)
                .single();
            if (matchError)
                throw matchError;
            // Clear cache
            this.clearCache('getPlayerMatches');
            this.clearCache('getActiveMatches');
            return { data: match, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'createMatch'),
                success: false
            };
        }
    }
    /**
     * Update match score and status
     */
    async updateMatchScore(matchId, data) {
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
            const { data: match, error: updateError } = await this.supabase
                .from('matches')
                .update(updateData)
                .eq('id', matchId)
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues(*)
        `)
                .single();
            if (updateError)
                throw updateError;
            // Clear cache
            this.clearCache('getPlayerMatches');
            this.clearCache('getMatchDetails');
            this.clearCache('getActiveMatches');
            return { data: match, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'updateMatchScore'),
                success: false
            };
        }
    }
    /**
     * Get match participants
     */
    async getMatchParticipants(matchId) {
        try {
            console.log('👥 MatchService.getMatchParticipants:', matchId);
            const cacheKey = this.getCacheKey('getMatchParticipants', { matchId });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return { data: cached, error: null, success: true };
            }
            // Get match details
            const { data: match, error: matchError } = await this.supabase
                .from('matches')
                .select(`
          id,
          home_team_id,
          away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name, team_color),
          away_team:teams!matches_away_team_id_fkey(id, name, team_color)
        `)
                .eq('id', matchId)
                .single();
            if (matchError)
                throw matchError;
            // Get participants
            const { data: participants, error: participantsError } = await this.supabase
                .from('match_participants')
                .select(`
          *,
          user:user_profiles(id, display_name, full_name, avatar_url, preferred_position)
        `)
                .eq('match_id', matchId)
                .order('jersey_number', { ascending: true });
            if (participantsError)
                throw participantsError;
            // Group by team
            const homeParticipants = participants?.filter(p => p.team_id === match.home_team_id) || [];
            const awayParticipants = participants?.filter(p => p.team_id === match.away_team_id) || [];
            const result = {
                homeTeam: {
                    ...match.home_team,
                    participants: homeParticipants.map(p => ({
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
                    participants: awayParticipants.map(p => ({
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
            return { data: result, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getMatchParticipants'),
                success: false
            };
        }
    }
    /**
     * Add participant to match
     */
    async addMatchParticipant(data) {
        try {
            console.log('➕ MatchService.addMatchParticipant:', data);
            const { data: participant, error } = await this.supabase
                .from('match_participants')
                .upsert({
                match_id: data.matchId,
                team_id: data.teamId,
                user_id: data.userId,
                position: data.position || null,
                jersey_number: data.jerseyNumber || null,
                is_starter: data.isStarter || false,
                is_captain: data.isCaptain || false
            }, {
                onConflict: 'match_id,user_id'
            })
                .select(`
          *,
          user:user_profiles(id, display_name, full_name)
        `)
                .single();
            if (error)
                throw error;
            // Clear cache
            this.clearCache('getMatchParticipants');
            return { data: participant, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'addMatchParticipant'),
                success: false
            };
        }
    }
    /**
     * Remove participant from match
     */
    async removeMatchParticipant(participantId) {
        try {
            console.log('🗑️ MatchService.removeMatchParticipant:', participantId);
            const { error } = await this.supabase
                .from('match_participants')
                .delete()
                .eq('id', participantId);
            if (error)
                throw error;
            // Clear cache
            this.clearCache('getMatchParticipants');
            return { data: null, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'removeMatchParticipant'),
                success: false
            };
        }
    }
    /**
     * Clear cache
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
}
//# sourceMappingURL=match.service.js.map