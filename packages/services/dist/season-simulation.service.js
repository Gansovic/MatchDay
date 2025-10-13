/**
 * Season Simulation Service
 *
 * Simulates complete seasons with realistic match results and player statistics.
 * Creates a new simulated season based on an existing season's teams and configuration.
 */
import { SeasonService } from './season.service';
export class SeasonSimulationService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.seasonService = SeasonService.getInstance(supabaseClient);
    }
    static getInstance(supabaseClient) {
        if (!SeasonSimulationService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            SeasonSimulationService.instance = new SeasonSimulationService(supabaseClient);
        }
        return SeasonSimulationService.instance;
    }
    /**
     * Simulate a complete season based on an existing season
     */
    async simulateCompleteSeason(sourceSeasonId, userId) {
        try {
            console.log('🎮 Starting season simulation for:', sourceSeasonId);
            // 1. Get source season details
            const sourceSeasonResponse = await this.seasonService.getSeasonDetails(sourceSeasonId);
            if (!sourceSeasonResponse.success || !sourceSeasonResponse.data) {
                return {
                    data: null,
                    error: 'Source season not found',
                    success: false,
                    message: 'Failed to load source season'
                };
            }
            const sourceSeason = sourceSeasonResponse.data;
            console.log('✅ Loaded source season:', sourceSeason.name);
            // 2. Create simulated season
            const simulatedSeasonName = `Simulated - ${sourceSeason.name}`;
            const newSeasonData = {
                name: simulatedSeasonName,
                display_name: `${sourceSeason.display_name || sourceSeason.name} (Simulated)`,
                league_id: sourceSeason.league_id,
                season_year: sourceSeason.season_year,
                status: 'completed', // Simulated seasons are always completed
                tournament_format: sourceSeason.tournament_format,
                start_date: sourceSeason.start_date,
                end_date: sourceSeason.end_date,
                registration_deadline: sourceSeason.registration_deadline,
                match_frequency: sourceSeason.match_frequency,
                preferred_match_time: sourceSeason.preferred_match_time,
                min_teams: sourceSeason.min_teams,
                max_teams: sourceSeason.max_teams,
                rounds: sourceSeason.rounds,
                points_for_win: sourceSeason.points_for_win,
                points_for_draw: sourceSeason.points_for_draw,
                points_for_loss: sourceSeason.points_for_loss,
                allow_draws: sourceSeason.allow_draws,
                home_away_balance: sourceSeason.home_away_balance,
                match_day: sourceSeason.match_day,
                match_start_time: sourceSeason.match_start_time,
                match_end_time: sourceSeason.match_end_time,
                courts_available: sourceSeason.courts_available,
                games_per_court: sourceSeason.games_per_court,
                rest_weeks_between_matches: sourceSeason.rest_weeks_between_matches,
                fixtures_status: 'pending',
                created_by: userId
            };
            const createSeasonResponse = await this.seasonService.createSeason(newSeasonData);
            if (!createSeasonResponse.success || !createSeasonResponse.data) {
                return {
                    data: null,
                    error: createSeasonResponse.error,
                    success: false,
                    message: 'Failed to create simulated season'
                };
            }
            const newSeasonId = createSeasonResponse.data.id;
            console.log('✅ Created simulated season:', newSeasonId);
            // 3. Copy teams from source season
            const teams = sourceSeason.teams || [];
            if (teams.length === 0) {
                return {
                    data: null,
                    error: 'No teams found in source season',
                    success: false,
                    message: 'Source season has no registered teams'
                };
            }
            console.log(`🔄 Copying ${teams.length} teams...`);
            for (const team of teams) {
                await this.seasonService.registerTeamForSeason(newSeasonId, team.team_id);
            }
            console.log('✅ Teams copied successfully');
            // 4. Generate fixtures
            console.log('🔄 Generating fixtures...');
            const fixturesResponse = await this.seasonService.generateFixtures(newSeasonId);
            if (!fixturesResponse.success || !fixturesResponse.data) {
                return {
                    data: null,
                    error: fixturesResponse.error,
                    success: false,
                    message: 'Failed to generate fixtures'
                };
            }
            const matches = fixturesResponse.data;
            console.log(`✅ Generated ${matches.length} fixtures`);
            // 5. Get all players for simulation
            const teamIds = teams.map(t => t.team_id);
            const players = await this.getTeamPlayers(teamIds);
            console.log(`✅ Loaded ${players.length} players`);
            // 6. Simulate all matches
            console.log('🎮 Simulating all matches...');
            let matchesSimulated = 0;
            for (const match of matches) {
                await this.simulateMatch(match, players);
                matchesSimulated++;
                if (matchesSimulated % 10 === 0) {
                    console.log(`✅ Simulated ${matchesSimulated}/${matches.length} matches`);
                }
            }
            console.log('✅ Season simulation completed successfully');
            return {
                data: {
                    seasonId: newSeasonId,
                    matchesSimulated
                },
                error: null,
                success: true,
                message: `Successfully simulated ${matchesSimulated} matches`
            };
        }
        catch (error) {
            console.error('❌ Season simulation error:', error);
            return {
                data: null,
                error,
                success: false,
                message: error instanceof Error ? error.message : 'Failed to simulate season'
            };
        }
    }
    /**
     * Get all players for given teams
     */
    async getTeamPlayers(teamIds) {
        const { data: teamMembers, error } = await this.supabase
            .from('team_members')
            .select(`
        user_id,
        team_id,
        position,
        user_profiles!inner (
          display_name,
          preferred_position
        )
      `)
            .in('team_id', teamIds)
            .eq('is_active', true);
        if (error) {
            console.error('Error loading team players:', error);
            return [];
        }
        return (teamMembers || []).map(member => ({
            user_id: member.user_id,
            team_id: member.team_id,
            position: member.position || member.user_profiles?.preferred_position || 'midfielder',
            display_name: member.user_profiles?.display_name
        }));
    }
    /**
     * Simulate a single match with realistic scores and player stats
     */
    async simulateMatch(match, allPlayers) {
        // Generate realistic scores (weighted toward lower scores)
        const homeScore = this.generateRealisticScore();
        const awayScore = this.generateRealisticScore();
        // Get players for both teams
        const homePlayers = allPlayers.filter(p => p.team_id === match.home_team_id);
        const awayPlayers = allPlayers.filter(p => p.team_id === match.away_team_id);
        // Generate player stats
        const homePlayerStats = this.generatePlayerStats(homePlayers, homeScore, awayScore === 0);
        const awayPlayerStats = this.generatePlayerStats(awayPlayers, awayScore, homeScore === 0);
        // Update match with score
        await this.supabase
            .from('matches')
            .update({
            home_score: homeScore,
            away_score: awayScore,
            status: 'completed',
            updated_at: new Date().toISOString()
        })
            .eq('id', match.id);
        // Insert player stats
        const allPlayerStats = [...homePlayerStats, ...awayPlayerStats].map(stat => ({
            user_id: stat.user_id,
            match_id: match.id,
            team_id: stat.team_id,
            goals: stat.goals,
            assists: stat.assists,
            minutes_played: stat.minutes_played,
            yellow_cards: stat.yellow_cards,
            red_cards: stat.red_cards,
            clean_sheets: stat.clean_sheets,
            saves: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        if (allPlayerStats.length > 0) {
            await this.supabase
                .from('player_stats')
                .insert(allPlayerStats);
        }
    }
    /**
     * Generate realistic match score (weighted toward lower scores)
     */
    generateRealisticScore() {
        const rand = Math.random();
        // Realistic distribution:
        // 0 goals: 25%
        // 1 goal: 35%
        // 2 goals: 25%
        // 3 goals: 10%
        // 4+ goals: 5%
        if (rand < 0.25)
            return 0;
        if (rand < 0.60)
            return 1;
        if (rand < 0.85)
            return 2;
        if (rand < 0.95)
            return 3;
        return Math.floor(Math.random() * 2) + 4; // 4 or 5
    }
    /**
     * Generate player statistics for a team
     */
    generatePlayerStats(players, teamGoals, isCleanSheet) {
        const stats = [];
        // Create base stats for each player
        for (const player of players) {
            const isGoalkeeper = player.position?.toLowerCase().includes('goal') || player.position === 'goalkeeper';
            stats.push({
                user_id: player.user_id,
                team_id: player.team_id,
                goals: 0,
                assists: 0,
                minutes_played: 90,
                yellow_cards: Math.random() < 0.12 ? 1 : 0, // 12% chance
                red_cards: Math.random() < 0.02 ? 1 : 0, // 2% chance
                clean_sheets: isGoalkeeper && isCleanSheet ? 1 : 0
            });
        }
        // Distribute goals among players by position
        const forwards = players.filter(p => p.position?.toLowerCase().includes('forward') || p.position === 'forward');
        const midfielders = players.filter(p => p.position?.toLowerCase().includes('mid') || p.position === 'midfielder');
        const defenders = players.filter(p => p.position?.toLowerCase().includes('def') ||
            p.position === 'defender' ||
            (!p.position?.toLowerCase().includes('forward') &&
                !p.position?.toLowerCase().includes('mid') &&
                !p.position?.toLowerCase().includes('goal')));
        for (let i = 0; i < teamGoals; i++) {
            let scorer;
            const rand = Math.random();
            // Position-based goal probability
            if (rand < 0.60 && forwards.length > 0) {
                // 60% forwards
                scorer = forwards[Math.floor(Math.random() * forwards.length)];
            }
            else if (rand < 0.85 && midfielders.length > 0) {
                // 25% midfielders
                scorer = midfielders[Math.floor(Math.random() * midfielders.length)];
            }
            else if (defenders.length > 0) {
                // 15% defenders
                scorer = defenders[Math.floor(Math.random() * defenders.length)];
            }
            else if (players.length > 0) {
                // Fallback to any player
                scorer = players[Math.floor(Math.random() * players.length)];
            }
            if (scorer) {
                const scorerStat = stats.find(s => s.user_id === scorer.user_id);
                if (scorerStat) {
                    scorerStat.goals++;
                    // 40% chance of assist
                    if (Math.random() < 0.40) {
                        const eligibleForAssist = players.filter(p => p.user_id !== scorer.user_id);
                        if (eligibleForAssist.length > 0) {
                            const assister = eligibleForAssist[Math.floor(Math.random() * eligibleForAssist.length)];
                            const assisterStat = stats.find(s => s.user_id === assister.user_id);
                            if (assisterStat) {
                                assisterStat.assists++;
                            }
                        }
                    }
                }
            }
        }
        return stats;
    }
}
//# sourceMappingURL=season-simulation.service.js.map