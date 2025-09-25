/**
 * Sample Data Generator for MatchDay
 * 
 * Generates realistic sample data for demonstration purposes including:
 * - 4-team league with realistic Premier League team names
 * - Complete round-robin tournament schedule
 * - Randomized but realistic match results
 * - Player statistics and achievements
 */

export interface SampleTeam {
  id: string;
  name: string;
  team_color: string;
  short_name: string;
}

export interface SampleMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  match_date: string;
  venue: string;
  status: 'completed';
  match_day: number;
}

export interface SamplePlayer {
  id: string;
  name: string;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  team_id: string;
  jersey_number: number;
}

export interface SamplePlayerStat {
  player_id: string;
  match_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  clean_sheets: number;
}

export class SampleDataGenerator {
  private static readonly SAMPLE_TEAMS: SampleTeam[] = [
    {
      id: 'sample-team-1',
      name: 'Arsenal FC',
      team_color: '#DC2626',
      short_name: 'ARS'
    },
    {
      id: 'sample-team-2', 
      name: 'Chelsea FC',
      team_color: '#1E40AF',
      short_name: 'CHE'
    },
    {
      id: 'sample-team-3',
      name: 'Liverpool FC',
      team_color: '#DC2626',
      short_name: 'LIV'
    },
    {
      id: 'sample-team-4',
      name: 'Manchester United',
      team_color: '#DC2626',
      short_name: 'MAN'
    }
  ];

  private static readonly SAMPLE_PLAYERS: Record<string, { name: string; position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'; jersey: number }[]> = {
    'sample-team-1': [ // Arsenal FC
      { name: 'Aaron Ramsdale', position: 'goalkeeper', jersey: 1 },
      { name: 'William Saliba', position: 'defender', jersey: 12 },
      { name: 'Gabriel Magalhães', position: 'defender', jersey: 6 },
      { name: 'Declan Rice', position: 'midfielder', jersey: 41 },
      { name: 'Martin Ødegaard', position: 'midfielder', jersey: 8 },
      { name: 'Bukayo Saka', position: 'forward', jersey: 7 },
      { name: 'Gabriel Jesus', position: 'forward', jersey: 9 },
    ],
    'sample-team-2': [ // Chelsea FC
      { name: 'Robert Sánchez', position: 'goalkeeper', jersey: 1 },
      { name: 'Thiago Silva', position: 'defender', jersey: 6 },
      { name: 'Reece James', position: 'defender', jersey: 24 },
      { name: 'Enzo Fernández', position: 'midfielder', jersey: 5 },
      { name: 'Conor Gallagher', position: 'midfielder', jersey: 23 },
      { name: 'Raheem Sterling', position: 'forward', jersey: 7 },
      { name: 'Nicolas Jackson', position: 'forward', jersey: 15 },
    ],
    'sample-team-3': [ // Liverpool FC
      { name: 'Alisson Becker', position: 'goalkeeper', jersey: 1 },
      { name: 'Virgil van Dijk', position: 'defender', jersey: 4 },
      { name: 'Andy Robertson', position: 'defender', jersey: 26 },
      { name: 'Alexis Mac Allister', position: 'midfielder', jersey: 10 },
      { name: 'Dominik Szoboszlai', position: 'midfielder', jersey: 8 },
      { name: 'Mohamed Salah', position: 'forward', jersey: 11 },
      { name: 'Darwin Núñez', position: 'forward', jersey: 9 },
    ],
    'sample-team-4': [ // Manchester United  
      { name: 'André Onana', position: 'goalkeeper', jersey: 24 },
      { name: 'Harry Maguire', position: 'defender', jersey: 5 },
      { name: 'Luke Shaw', position: 'defender', jersey: 23 },
      { name: 'Casemiro', position: 'midfielder', jersey: 18 },
      { name: 'Bruno Fernandes', position: 'midfielder', jersey: 8 },
      { name: 'Marcus Rashford', position: 'forward', jersey: 10 },
      { name: 'Rasmus Højlund', position: 'forward', jersey: 11 },
    ]
  };

  private static readonly VENUES = [
    'Emirates Stadium',
    'Stamford Bridge', 
    'Anfield',
    'Old Trafford',
    'Wembley Stadium',
    'London Stadium'
  ];

  /**
   * Generate a complete round-robin tournament schedule for 4 teams
   * Each team plays every other team twice (home and away)
   */
  static generateMatches(): SampleMatch[] {
    const teams = this.SAMPLE_TEAMS;
    const matches: SampleMatch[] = [];
    let matchId = 1;
    let matchDay = 1;

    // Generate all possible match combinations (round-robin)
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i !== j) {
          const homeTeam = teams[i];
          const awayTeam = teams[j];
          
          // Generate realistic scores (0-4 goals each team)
          const homeScore = Math.floor(Math.random() * 5);
          const awayScore = Math.floor(Math.random() * 5);
          
          // Generate random date in the past 3 months
          const daysAgo = Math.floor(Math.random() * 90) + 1;
          const matchDate = new Date();
          matchDate.setDate(matchDate.getDate() - daysAgo);
          
          const venue = this.VENUES[Math.floor(Math.random() * this.VENUES.length)];

          matches.push({
            id: `sample-match-${matchId}`,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            home_score: homeScore,
            away_score: awayScore,
            match_date: matchDate.toISOString(),
            venue,
            status: 'completed',
            match_day: matchDay
          });

          matchId++;
          if (matchId % 4 === 1) matchDay++; // Increment match day every 4 matches
        }
      }
    }

    // Sort matches by date (oldest first)
    return matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  }

  /**
   * Generate sample players for all teams
   */
  static generatePlayers(): SamplePlayer[] {
    const players: SamplePlayer[] = [];
    let playerId = 1;

    this.SAMPLE_TEAMS.forEach(team => {
      const teamPlayers = this.SAMPLE_PLAYERS[team.id] || [];
      
      teamPlayers.forEach(playerData => {
        players.push({
          id: `sample-player-${playerId}`,
          name: playerData.name,
          position: playerData.position,
          team_id: team.id,
          jersey_number: playerData.jersey
        });
        playerId++;
      });
    });

    return players;
  }

  /**
   * Generate realistic player statistics based on matches
   */
  static generatePlayerStats(matches: SampleMatch[], players: SamplePlayer[]): SamplePlayerStat[] {
    const stats: SamplePlayerStat[] = [];
    
    matches.forEach(match => {
      const homePlayers = players.filter(p => p.team_id === match.home_team_id);
      const awayPlayers = players.filter(p => p.team_id === match.away_team_id);
      
      // Distribute goals among players realistically
      this.distributeGoals(match, homePlayers, awayPlayers, stats);
    });

    return stats;
  }

  private static distributeGoals(match: SampleMatch, homePlayers: SamplePlayer[], awayPlayers: SamplePlayer[], stats: SamplePlayerStat[]) {
    // Create stats for all players in the match
    [...homePlayers, ...awayPlayers].forEach(player => {
      const isGoalkeeper = player.position === 'goalkeeper';
      const isForward = player.position === 'forward';
      const isMidfielder = player.position === 'midfielder';
      
      const stat: SamplePlayerStat = {
        player_id: player.id,
        match_id: match.id,
        goals: 0,
        assists: 0,
        yellow_cards: Math.random() < 0.1 ? 1 : 0,
        red_cards: Math.random() < 0.02 ? 1 : 0,
        minutes_played: 90,
        clean_sheets: 0
      };

      // Goalkeepers get clean sheets
      if (isGoalkeeper) {
        const isHomeTeam = player.team_id === match.home_team_id;
        const goalsAgainst = isHomeTeam ? match.away_score : match.home_score;
        if (goalsAgainst === 0) {
          stat.clean_sheets = 1;
        }
      }

      stats.push(stat);
    });

    // Distribute home team goals
    this.assignGoalsToPlayers(match.home_score, homePlayers, stats, match.id);
    
    // Distribute away team goals  
    this.assignGoalsToPlayers(match.away_score, awayPlayers, stats, match.id);
  }

  private static assignGoalsToPlayers(totalGoals: number, players: SamplePlayer[], stats: SamplePlayerStat[], matchId: string) {
    for (let i = 0; i < totalGoals; i++) {
      // Higher probability for forwards and midfielders to score
      const forwards = players.filter(p => p.position === 'forward');
      const midfielders = players.filter(p => p.position === 'midfielder');
      const defenders = players.filter(p => p.position === 'defender');
      
      let scorer: SamplePlayer;
      const rand = Math.random();
      
      if (rand < 0.6 && forwards.length > 0) {
        // 60% chance for forwards
        scorer = forwards[Math.floor(Math.random() * forwards.length)];
      } else if (rand < 0.85 && midfielders.length > 0) {
        // 25% chance for midfielders
        scorer = midfielders[Math.floor(Math.random() * midfielders.length)];
      } else if (defenders.length > 0) {
        // 15% chance for defenders
        scorer = defenders[Math.floor(Math.random() * defenders.length)];
      } else {
        // Fallback to any player
        scorer = players[Math.floor(Math.random() * players.length)];
      }

      // Add goal to player's stats
      const playerStat = stats.find(s => s.player_id === scorer.id && s.match_id === matchId);
      if (playerStat) {
        playerStat.goals++;
        
        // Add assist (30% chance, different player)
        if (Math.random() < 0.3) {
          const assistCandidates = players.filter(p => p.id !== scorer.id && p.position !== 'goalkeeper');
          if (assistCandidates.length > 0) {
            const assister = assistCandidates[Math.floor(Math.random() * assistCandidates.length)];
            const assisterStat = stats.find(s => s.player_id === assister.id && s.match_id === matchId);
            if (assisterStat) {
              assisterStat.assists++;
            }
          }
        }
      }
    }
  }

  /**
   * Generate a complete sample season data package
   */
  static generateSampleSeason() {
    const teams = this.SAMPLE_TEAMS;
    const matches = this.generateMatches();
    const players = this.generatePlayers();
    const playerStats = this.generatePlayerStats(matches, players);

    return {
      teams,
      matches,
      players,
      playerStats,
      seasonInfo: {
        name: 'Sample Season 2024',
        display_name: 'Premier League Demo Season',
        season_year: 2024,
        status: 'completed',
        start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
        end_date: new Date().toISOString().split('T')[0], // today
      }
    };
  }
}