# League Dashboard Components

A comprehensive set of reusable React Native components for building league dashboard screens in the MatchDay mobile app.

## Components Created

### 1. IconImage (Shared Component)
**Location:** `src/components/shared/IconImage.tsx`

Generic icon component with automatic loading, error handling, and fallback states.

**Features:**
- Loading spinner while image loads
- Automatic error handling with fallback icons
- 4 fallback icon types: trophy, calendar, users, shield
- Letter-based fallback with automatic color generation
- Configurable size and border radius (circular or rounded square)

**Props:**
```typescript
interface IconImageProps {
  url?: string | null;
  fallbackIcon: 'trophy' | 'calendar' | 'users' | 'shield';
  size?: number;
  fallbackColor?: string;
  fallbackLetter?: string;
  rounded?: boolean;
}
```

### 2. LeagueHeader
**Location:** `src/components/league/LeagueHeader.tsx`

Displays league header with icon and comprehensive metadata.

**Features:**
- 56x56 rounded league icon with fallback
- Large bold league name
- Color-coded league type badge (recreational=green, competitive=orange, semi-pro=red)
- Sport type display
- Optional location with icon
- Optional description (truncated to 3 lines)

**Props:**
```typescript
interface LeagueHeaderProps {
  league: {
    id: string;
    name: string;
    description?: string;
    sport_type: string;
    league_type: string;
    location?: string;
    logo_url?: string;
  };
}
```

### 3. LeagueStatsCards
**Location:** `src/components/league/LeagueStatsCards.tsx`

Displays 4 key statistics in a 2x2 grid layout.

**Features:**
- Total Matches (calendar icon, blue)
- Completed Matches (check circle icon, green)
- Upcoming Matches (clock icon, orange)
- Total Goals (target icon, purple)
- Each card shows icon, large number, and label
- Responsive grid layout

**Props:**
```typescript
interface StatsCardsProps {
  stats: {
    totalMatches: number;
    completed: number;
    upcoming: number;
    totalGoals: number;
  };
}
```

### 4. SeasonCard
**Location:** `src/components/league/SeasonCard.tsx`

Tappable card for displaying and navigating to seasons.

**Features:**
- 40x40 season icon with fallback
- Season name and year
- Status badge (active=green, completed=gray, registration=blue, upcoming=orange)
- Formatted date range
- Registered team count
- Chevron indicator for navigation
- Touch feedback

**Props:**
```typescript
interface SeasonCardProps {
  season: {
    id: string;
    name: string;
    season_year: number;
    status: string;
    start_date: string;
    end_date: string;
    icon_url?: string;
    registered_teams_count: number;
  };
  onPress: () => void;
}
```

### 5. StandingsTable
**Location:** `src/components/league/StandingsTable.tsx`

Comprehensive standings table with horizontal scrolling.

**Features:**
- Sticky position and team name columns
- Horizontal scrolling for stats (Pld, W, D, L, GD, Pts)
- Form indicator showing last 5 matches as colored badges
- User team highlighting (blue tint)
- Color-coded goal difference (green for positive)
- Proper table headers
- Empty state handling

**Props:**
```typescript
interface StandingsTableProps {
  standings: StandingRow[];
  userTeamIds?: string[];
}

interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}
```

### 6. MatchCard
**Location:** `src/components/league/MatchCard.tsx`

Card component for displaying match information.

**Features:**
- Date and time header with calendar icon
- Status badge (finished=green, live=red, scheduled=blue, cancelled=gray)
- Team names with color dots
- Large score display (for completed matches) or "vs" text
- Optional venue information with location icon
- Optional tap handler for navigation
- Touch feedback

**Props:**
```typescript
interface MatchCardProps {
  match: {
    id: string;
    homeTeam: { name: string; color?: string };
    awayTeam: { name: string; color?: string };
    homeScore?: number;
    awayScore?: number;
    matchDate: string;
    matchTime?: string;
    venue?: string;
    status: string;
  };
  onPress?: () => void;
}
```

## Usage

### Basic Import
```typescript
// Import individual components
import { LeagueHeader } from '../components/league/LeagueHeader';
import { LeagueStatsCards } from '../components/league/LeagueStatsCards';
import { SeasonCard } from '../components/league/SeasonCard';
import { StandingsTable } from '../components/league/StandingsTable';
import { MatchCard } from '../components/league/MatchCard';
import { IconImage } from '../components/shared/IconImage';

// Or use barrel imports
import {
  LeagueHeader,
  LeagueStatsCards,
  SeasonCard,
  StandingsTable,
  MatchCard
} from '../components/league';
import { IconImage } from '../components/shared';
```

### Example Screen Implementation
See `USAGE_EXAMPLE.md` for a complete LeagueDetailsScreen implementation.

## Styling

All components follow a consistent dark theme:
- Background: `#0a0a0a`
- Cards: `#1a1a1a`
- Borders: `#333`
- Primary text: `#fff`
- Secondary text: `#999`

Spacing is consistent across components:
- Small gap: 8px
- Medium gap: 12px
- Large gap: 16px
- Extra large gap: 24px

Touch feedback uses `activeOpacity: 0.7` for all interactive elements.

## File Structure

```
src/components/
├── shared/
│   ├── IconImage.tsx
│   └── index.ts
└── league/
    ├── LeagueHeader.tsx
    ├── LeagueStatsCards.tsx
    ├── SeasonCard.tsx
    ├── StandingsTable.tsx
    ├── MatchCard.tsx
    ├── index.ts
    ├── README.md
    └── USAGE_EXAMPLE.md
```

## Dependencies

These components use only React Native core components:
- View, Text, StyleSheet
- TouchableOpacity
- ScrollView
- Image
- ActivityIndicator

No external icon libraries are required. All icons are rendered using View-based shapes.

## Next Steps

The backend-database-engineer agent should create the following hooks to power these components:

1. `useLeagueDetails(leagueId)` - Fetch league information
2. `useLeagueStats(leagueId)` - Fetch league statistics
3. `useLeagueSeasons(leagueId)` - Fetch seasons list
4. `useLeagueStandings(seasonId)` - Fetch standings data
5. `useLeagueMatches(seasonId)` - Fetch matches list

See `USAGE_EXAMPLE.md` for detailed hook interfaces and implementation requirements.
