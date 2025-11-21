/**
 * Number and Data Formatters for MatchDay
 *
 * Centralized formatting utilities following LEVER principles.
 * ALL number and data formatting MUST use these utilities.
 *
 * @example
 * ```typescript
 * import { NumberFormatters, DateFormatters } from '@/lib/utils/formatters';
 *
 * <span>{NumberFormatters.formatGoals(15)}</span>
 * <span>{DateFormatters.formatMatchDate(matchDate)}</span>
 * ```
 *
 * These formatters should be used for ALL data display.
 */
export class NumberFormatters {
    /**
     * Format goals with appropriate suffix
     */
    static formatGoals(goals) {
        if (goals === 0)
            return '0 goals';
        if (goals === 1)
            return '1 goal';
        return `${goals.toLocaleString()} goals`;
    }
    /**
     * Format assists with appropriate suffix
     */
    static formatAssists(assists) {
        if (assists === 0)
            return '0 assists';
        if (assists === 1)
            return '1 assist';
        return `${assists.toLocaleString()} assists`;
    }
    /**
     * Format match score
     */
    static formatScore(homeScore, awayScore) {
        return `${homeScore} - ${awayScore}`;
    }
    /**
     * Format win/loss record
     */
    static formatRecord(wins, draws, losses) {
        return `${wins}W-${draws}D-${losses}L`;
    }
    /**
     * Format percentage with one decimal place
     */
    static formatPercentage(value, total) {
        if (total === 0)
            return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(1)}%`;
    }
    /**
     * Format win percentage
     */
    static formatWinPercentage(wins, totalGames) {
        return this.formatPercentage(wins, totalGames);
    }
    /**
     * Format goals per game average
     */
    static formatGoalsPerGame(goals, games) {
        if (games === 0)
            return '0.0';
        return (goals / games).toFixed(1);
    }
    /**
     * Format league points
     */
    static formatPoints(points) {
        if (points === 1)
            return '1 point';
        return `${points} points`;
    }
    /**
     * Format goal difference
     */
    static formatGoalDifference(goalsFor, goalsAgainst) {
        const diff = goalsFor - goalsAgainst;
        if (diff > 0)
            return `+${diff}`;
        return diff.toString();
    }
    /**
     * Format minutes played
     */
    static formatMinutes(minutes) {
        if (minutes < 60)
            return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    /**
     * Format player position
     */
    static formatPosition(position) {
        if (!position)
            return 'Player';
        const positionMap = {
            'gk': 'Goalkeeper',
            'def': 'Defender',
            'mid': 'Midfielder',
            'for': 'Forward',
            'goalkeeper': 'Goalkeeper',
            'defender': 'Defender',
            'midfielder': 'Midfielder',
            'forward': 'Forward'
        };
        return positionMap[position.toLowerCase()] || position;
    }
    /**
     * Format jersey number
     */
    static formatJerseyNumber(number) {
        if (!number)
            return '--';
        return `#${number}`;
    }
    /**
     * Format achievement points (with K/M suffixes for large numbers)
     */
    static formatAchievementPoints(points) {
        if (points >= 1000000) {
            return `${(points / 1000000).toFixed(1)}M`;
        }
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}K`;
        }
        return points.toString();
    }
    /**
     * Format performance rating
     */
    static formatRating(rating) {
        return `${rating.toFixed(1)}/100`;
    }
    /**
     * Format currency values
     */
    static formatCurrency(value, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(value);
    }
    /**
     * Format large numbers with appropriate suffixes
     */
    static formatNumber(value) {
        return new Intl.NumberFormat().format(value);
    }
}
export class DateFormatters {
    /**
     * Format match date for display
     */
    static formatMatchDate(date) {
        const matchDate = new Date(date);
        const now = new Date();
        const diffTime = matchDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            return `Today at ${matchDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }
        else if (diffDays === 1) {
            return `Tomorrow at ${matchDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }
        else if (diffDays === -1) {
            return `Yesterday at ${matchDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }
        else if (diffDays > 0 && diffDays <= 7) {
            return matchDate.toLocaleDateString([], {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        else {
            return matchDate.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    /**
     * Format match time for live scores
     */
    static formatMatchTime(startTime, status) {
        if (status === 'completed')
            return 'FT';
        if (status === 'scheduled') {
            return this.formatMatchDate(startTime);
        }
        if (status === 'in_progress') {
            const start = new Date(startTime);
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
            return `${Math.min(diffMinutes, 90)}'`;
        }
        return '--';
    }
    /**
     * Format season period
     */
    static formatSeasonPeriod(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start.getFullYear() === end.getFullYear()) {
            return `${start.getFullYear()} Season`;
        }
        else {
            return `${start.getFullYear()}-${end.getFullYear().toString().slice(-2)} Season`;
        }
    }
    /**
     * Format relative time (e.g., "2 hours ago")
     */
    static formatRelativeTime(date) {
        const past = new Date(date);
        const now = new Date();
        const diffTime = now.getTime() - past.getTime();
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMinutes < 1)
            return 'Just now';
        if (diffMinutes < 60)
            return `${diffMinutes}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return past.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Format age from birth date
     */
    static formatAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} years old`;
    }
}
export class StatusFormatters {
    /**
     * Format match status for display
     */
    static formatMatchStatus(status) {
        const statusMap = {
            'scheduled': { text: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
            'in_progress': { text: 'Live', color: 'bg-green-100 text-green-800' },
            'completed': { text: 'Final', color: 'bg-gray-100 text-gray-800' },
            'cancelled': { text: 'Cancelled', color: 'bg-red-100 text-red-800' },
            'postponed': { text: 'Postponed', color: 'bg-yellow-100 text-yellow-800' }
        };
        return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    }
    /**
     * Format league type for display
     */
    static formatLeagueType(type) {
        const typeMap = {
            'recreational': 'Recreational',
            'competitive': 'Competitive',
            'semi-pro': 'Semi-Professional',
            'youth': 'Youth League',
            'masters': 'Masters League'
        };
        return typeMap[type] || type;
    }
    /**
     * Format sport type for display
     */
    static formatSportType(sport) {
        const sportMap = {
            'soccer': 'Soccer',
            'football': 'Football',
            'basketball': 'Basketball',
            'volleyball': 'Volleyball',
            'tennis': 'Tennis',
            'baseball': 'Baseball',
            'hockey': 'Hockey'
        };
        return sportMap[sport] || sport;
    }
}
//# sourceMappingURL=formatters.js.map