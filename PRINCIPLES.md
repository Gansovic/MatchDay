# MatchDay Engineering Principles

**THIS DOCUMENT IS MANDATORY FOR ALL ENGINEERS INCLUDING AI ASSISTANTS**

## Architecture Overview

MatchDay is a football/soccer league management platform built with:
- **Next.js 15** with App Router
- **React 19** for UI
- **TypeScript 5** with strict mode
- **Supabase** for database and authentication
- **Tailwind CSS v4** for styling
- **TanStack Query** for state management

### Key Architecture Decisions

1. **API Routes over Edge Functions**: We use Next.js API Routes for all server-side logic instead of Supabase Edge Functions for simplicity and easier development
2. **Service Layer Pattern**: All business logic is centralized in service classes
3. **Server-Side Authority**: All data mutations happen through API routes, never directly from client
4. **No Live Match Tracking**: Matches are recorded post-game, not in real-time

## The LEVER Framework

### L - Leverage Existing Patterns

**DO:**
```typescript
// Use existing services
const leagues = await LeagueService.getInstance().getAllLeagues();
const matches = await MatchService.getInstance().getTeamMatches(teamId);

// Use existing UI components
import { ProfessionalCard, LoadingDialog, StatsDisplay } from '@/components/ui';

// Use TanStack Query for data fetching
function useTeamMatches(teamId: string) {
  return useQuery({
    queryKey: ['matches', 'team', teamId],
    queryFn: () => MatchService.getInstance().getTeamMatches(teamId),
  });
}
```

**DON'T:**
```typescript
// NEVER access Supabase directly from client
const { data } = await supabase.from('teams').select('*'); // WRONG

// NEVER create custom loading patterns
return <div className="spinner">Loading...</div>; // WRONG

// NEVER bypass service layer
const response = await fetch('/api/teams'); // WRONG - use TeamService
```

**EXISTING PATTERNS TO LEVERAGE:**
- ✅ `LeagueService` - ALL league operations
- ✅ `TeamService` - ALL team operations
- ✅ `MatchService` - ALL match operations
- ✅ `PlayerService` - ALL player operations
- ✅ `StatsService` - ALL statistics calculations
- ✅ `SeasonService` - ALL season management
- ✅ `AchievementService` - ALL achievement operations
- ✅ `AnalyticsService` - ALL cross-league analytics
- ✅ `ConfigService` - ALL configuration
- ✅ `ProfessionalCard` - Reusable card component
- ✅ `LoadingDialog` - Loading states
- ✅ `StatsDisplay` - Statistics display
- ✅ TanStack Query - Server state management
- ✅ Supabase Auth - Authentication

### E - Extend Before Creating

**DO:**
```typescript
// Extend existing types
interface EnhancedMatch extends Match {
  weatherConditions?: string;
  attendance?: number;
}

// Compose existing components
function MatchCardWithStats({ match }: { match: Match }) {
  return (
    <ProfessionalCard>
      <MatchDetails match={match} />
      <StatsDisplay stats={match.stats} />
    </ProfessionalCard>
  );
}
```

**DON'T:**
```typescript
// NEVER create parallel implementations
class MyMatchService { } // WRONG - extend MatchService

// NEVER duplicate functionality
function formatScore() { } // WRONG - use existing formatters
```

### V - Verify Through Reactivity

**DO:**
```typescript
// TanStack Query for server state
function useLeagueStandings(leagueId: string) {
  return useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => LeagueService.getInstance().getStandings(leagueId),
    staleTime: 30000,
  });
}

// React state for UI state
const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
```

**DON'T:**
```typescript
// NEVER manage server state manually
const [teams, setTeams] = useState([]); // WRONG - use TanStack Query

// NEVER use manual polling
setInterval(() => fetchData(), 5000); // WRONG
```

### E - Eliminate Duplication

**DO:**
```typescript
// Centralize constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Reuse validation
export class MatchValidator {
  static validateScore(score: number): boolean {
    return score >= 0 && score < 100;
  }
}
```

**DON'T:**
```typescript
// NEVER duplicate strings
if (match.status === 'completed') { } // WRONG - use MATCH_STATUS

// NEVER duplicate logic
if (score >= 0 && score < 100) { } // WRONG - use MatchValidator
```

### R - Reduce Complexity

**DO:**
```typescript
// Simple, single-purpose functions
async function isTeamCaptain(userId: string, teamId: string): Promise<boolean> {
  const team = await TeamService.getInstance().getTeam(teamId);
  return team?.captain_id === userId;
}

// Early returns
function calculatePoints(match: Match): number {
  if (match.status !== 'completed') return 0;
  if (!match.winner_id) return 1; // Draw
  return 3; // Win
}
```

**DON'T:**
```typescript
// NEVER create complex multi-purpose functions
async function processMatchAndUpdateStatsAndNotify() { } // WRONG

// NEVER nest deeply
if (a) {
  if (b) {
    if (c) { } // WRONG - use early returns
  }
}
```

## Core Technical Rules

### 1. Server-Side Authority

**RULE:** ALL data mutations MUST go through Next.js API Routes

```typescript
// CLIENT - CORRECT
async function recordMatch(matchData: MatchData) {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matchData),
  });

  if (!response.ok) throw new Error('Failed to record match');
  return response.json();
}

// API ROUTE - CORRECT
// src/app/api/matches/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const matchData = await request.json();

  // Validate
  const validated = matchSchema.parse(matchData);

  // Insert match
  const { data: match, error } = await supabase
    .from('matches')
    .insert(validated)
    .select()
    .single();

  if (error) throw error;

  // Update stats
  await updateTeamStats(match);

  return NextResponse.json(match);
}
```

**NEVER:**
```typescript
// CLIENT - WRONG
await supabase.from('matches').insert(matchData); // NEVER from client
```

### 2. Service Layer Pattern

**RULE:** ALL business logic MUST be in service classes

```typescript
// CORRECT
class MatchService {
  private static instance: MatchService;

  static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  async getTeamMatches(teamId: string): Promise<Match[]> {
    const response = await fetch(`/api/teams/${teamId}/matches`);
    return response.json();
  }
}
```

### 3. Authentication & Authorization

**RULE:** ALL routes MUST verify authentication

```typescript
// API Route - CORRECT
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify authorization
  const canEdit = await verifyTeamPermission(user.id, teamId);
  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request
}
```

### 4. Data Validation

**RULE:** ALL inputs MUST be validated with Zod

```typescript
import { z } from 'zod';

const matchSchema = z.object({
  home_team_id: z.string().uuid(),
  away_team_id: z.string().uuid(),
  home_score: z.number().min(0).max(99),
  away_score: z.number().min(0).max(99),
  match_date: z.string().datetime(),
});

// In API route
const validated = matchSchema.parse(requestData);
```

### 5. Error Handling

**RULE:** ALL errors MUST be handled consistently

```typescript
// CORRECT
async function safeOperation<T>(): Promise<T | null> {
  try {
    return await riskyOperation();
  } catch (error) {
    console.error('Operation failed:', error);
    toast.error('Something went wrong. Please try again.');
    return null;
  }
}
```

### 6. Testing Requirements

**RULE:** ALL new code MUST have tests (target: 80% coverage)

```typescript
// Service test
describe('MatchService', () => {
  it('should fetch team matches', async () => {
    const matches = await MatchService.getInstance().getTeamMatches('team-id');
    expect(matches).toBeDefined();
  });
});

// Component test
describe('MatchCard', () => {
  it('renders match details', () => {
    render(<MatchCard match={mockMatch} />);
    expect(screen.getByText('Team A vs Team B')).toBeInTheDocument();
  });
});
```

## File Organization

```
/Users/lukini/MatchDay/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # User dashboard
│   │   ├── leagues/           # League pages
│   │   ├── teams/             # Team pages
│   │   └── matches/           # Match pages
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   └── auth/              # Auth components
│   ├── lib/
│   │   ├── services/          # Business logic services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── supabase/          # Supabase clients
│   └── types/                 # TypeScript types
├── matchday-admin/            # Admin application
└── supabase/
    ├── migrations/            # Database migrations
    └── seed.sql              # Seed data
```

## Naming Conventions

```typescript
// Services
class TeamService { }           // PascalCase + Service suffix

// Hooks
function useTeamData() { }      // camelCase + use prefix

// Components
function TeamCard() { }         // PascalCase

// Types
interface Team { }              // PascalCase
type TeamStatus = 'active' | 'inactive';

// Constants
const MAX_TEAM_SIZE = 20;       // UPPER_SNAKE_CASE

// Functions
function calculatePoints() { }  // camelCase, verb-based

// Booleans
const isActive: boolean;        // is/has/can prefix
```

## State Management Rules

1. **Server State** → TanStack Query
2. **UI State** → React useState/useReducer
3. **Global State** → React Context (sparingly)
4. **Form State** → React Hook Form

```typescript
// Server state - CORRECT
function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => TeamService.getInstance().getAllTeams(),
  });
}

// UI state - CORRECT
const [isModalOpen, setIsModalOpen] = useState(false);
```

## Security Best Practices

1. **Never expose sensitive data in logs**
```typescript
console.log('Processing for user'); // Good
console.log(`User ${user.email} logged in`); // BAD - exposes PII
```

2. **Use RLS policies in Supabase**
```sql
CREATE POLICY "Users can only read own teams" ON teams
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM team_members WHERE team_id = teams.id
  ));
```

3. **Validate all inputs**
```typescript
const validated = teamSchema.parse(userInput); // Always validate
```

4. **Use environment variables for secrets**
```typescript
const apiKey = process.env.NEXT_PUBLIC_API_KEY; // Never hardcode
```

## Git Commit Standards

Follow conventional commits:

```bash
feat: Add player statistics dashboard
fix: Correct team standings calculation
refactor: Extract match validation to service
test: Add unit tests for MatchService
docs: Update API documentation
chore: Update dependencies
```

## Code Review Checklist

- [ ] Leverages existing patterns and services
- [ ] Extends existing code rather than duplicating
- [ ] Uses TanStack Query for server state
- [ ] Eliminates all duplication
- [ ] Reduces complexity (single responsibility, early returns)
- [ ] NO direct Supabase writes from client
- [ ] Uses Next.js API routes for mutations
- [ ] Includes proper error handling
- [ ] Has tests for new functionality
- [ ] Follows naming conventions
- [ ] Updates types if needed

## Common Patterns

### Fetching Data
```typescript
function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: () => LeagueService.getInstance().getAllLeagues(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Mutating Data
```typescript
function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamData: TeamData) => TeamService.getInstance().createTeam(teamData),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    },
  });
}
```

### Protected Routes
```typescript
export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <Dashboard />;
}
```

## Performance Guidelines

1. **Use React.memo for expensive components**
```typescript
export const TeamCard = React.memo(({ team }: { team: Team }) => {
  return <Card>{/* ... */}</Card>;
});
```

2. **Optimize images with Next.js Image**
```typescript
import Image from 'next/image';

<Image src={logo} alt="Team logo" width={100} height={100} />
```

3. **Use dynamic imports for large components**
```typescript
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <LoadingDialog />,
});
```

4. **Clean up subscriptions**
```typescript
useEffect(() => {
  const subscription = supabase.channel('changes').subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Documentation Requirements

All public APIs must be documented:

```typescript
/**
 * Service for managing team operations.
 *
 * Handles:
 * - Team CRUD operations
 * - Member management
 * - Team statistics
 *
 * @example
 * ```typescript
 * const service = TeamService.getInstance();
 * const teams = await service.getAllTeams();
 * ```
 */
export class TeamService {
  /**
   * Creates a new team.
   *
   * @param teamData - Team creation data
   * @returns Promise<Team> - Created team
   * @throws {ValidationError} if data is invalid
   */
  async createTeam(teamData: CreateTeamData): Promise<Team> { }
}
```

## Automated Enforcement

Pre-commit hooks validate:
- TypeScript type checking (`npm run type-check`)
- ESLint linting (`npm run lint`)
- Prettier formatting (`npm run format`)
- Test coverage (`npm run test`)

```bash
# Run all validations
npm run lint
npm run type-check
npm run test

# Fix auto-fixable issues
npm run lint:fix
npm run format
```

## Living Document

Update this document when:
- New reusable patterns are created
- Architecture decisions change
- Best practices evolve
- Common mistakes are identified

**NO EXCEPTIONS. NO NEGOTIATIONS.**
