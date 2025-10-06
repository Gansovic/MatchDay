# MatchDay Implementation Guide

## Overview
MatchDay is a comprehensive amateur sports league application that makes amateur players feel professional through sophisticated tracking, cross-league comparisons, and gamification features. Built on Next.js 15 with React 19, TypeScript, and Tailwind CSS v4, following the LEVER Framework principles.

## 🎯 Core Features Implemented

### 1. Professional Database Architecture ✅
- **File**: `/docs/database-schema.md`
- Comprehensive schema for leagues, teams, players, matches, and statistics
- Row Level Security (RLS) policies for data protection
- Optimized indexes and views for performance
- Support for cross-league comparisons

### 2. LEVER Framework Service Architecture ✅
- **ConfigService** (`/src/lib/services/config.service.ts`) - Centralized configuration management
- **LeagueService** (`/src/lib/services/league.service.ts`) - All league read operations
- **EdgeFunctionsService** (`/src/lib/services/edge-functions.service.ts`) - Server-side business logic
- **AnalyticsService** (`/src/lib/services/analytics.service.ts`) - Cross-league analytics
- **MatchService** (`/src/lib/services/match.service.ts`) - Match data operations
- **AuthService** (`/src/lib/auth/auth.service.ts`) - Authentication management
- **AchievementService** (`/src/lib/services/achievement.service.ts`) - Gamification features

### 3. Professional UI Components ✅
- **ProfessionalCard** (`/src/components/ui/professional-card.tsx`) - Reusable card component
- **LoadingDialog** (`/src/components/ui/loading-dialog.tsx`) - Consistent loading states
- **StatsDisplay** (`/src/components/ui/stats-display.tsx`) - Professional statistics display
- **MatchCard** (`/src/components/features/match-card.tsx`) - Professional match displays
- **GlobalLeaderboard** (`/src/components/features/global-leaderboard.tsx`) - Cross-league rankings
- **LiveMatchTracker** (`/src/components/features/live-match-tracker.tsx`) - Real-time match tracking
- **AchievementShowcase** (`/src/components/features/achievement-showcase.tsx`) - Gamification display

### 4. Cross-League Analytics ✅
- Global player rankings across all leagues
- Cross-league performance comparisons
- League strength analysis
- Player similarity matching
- Comprehensive leaderboards

### 5. Authentication & User Management ✅
- **AuthProvider** (`/src/components/auth/auth-provider.tsx`) - React context for auth state
- Supabase Auth integration
- Automatic profile creation
- Permission-based access control
- OAuth provider support

### 6. Real-Time Features ✅
- **useRealtimeMatches** (`/src/lib/hooks/use-realtime-matches.ts`) - Live match updates
- Supabase real-time subscriptions
- Live match events and score updates
- Team-specific notifications
- Connection status monitoring

### 7. Achievement System ✅
- Comprehensive achievement tracking
- Progress monitoring
- Rarity calculations
- Achievement leaderboards
- Visual badge system with tooltips

### 8. Utility Systems ✅
- **Formatters** (`/src/lib/utils/formatters.ts`) - Centralized data formatting
- **Database Types** (`/src/lib/types/database.types.ts`) - TypeScript type safety
- Professional date/time formatting
- Number formatting with proper pluralization

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @tanstack/react-query react-dom@19.1.0 react@19.1.0
npm install --save-dev @types/react@^19 @types/react-dom@^19
```

### 2. Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL from `/docs/database-schema.md`
3. Enable Row Level Security
4. Configure authentication providers (optional)

### 4. Edge Functions (Required for Production)
Create these Supabase Edge Functions:
- `create-league`
- `update-league`
- `create-team`
- `join-team`
- `record-match-result`
- `update-user-profile`
- `check-achievements`
- `generate-schedule`

### 5. Root Layout Integration
Update your `src/app/layout.tsx`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider supabaseClient={supabase}>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
├── components/
│   ├── auth/                     # Authentication components
│   ├── features/                 # Feature-specific components
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── auth/                     # Authentication services
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Business logic services
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
└── docs/                         # Documentation
```

## 🎮 Usage Examples

### Basic League Operations
```typescript
import { LeagueService } from '@/lib/services/league.service';
import { EdgeFunctionsService } from '@/lib/services/edge-functions.service';

// Read operations
const leagues = await LeagueService.getInstance().getActiveLeagues();
const standings = await LeagueService.getInstance().getLeagueStandings(leagueId);

// Write operations (through Edge Functions)
const result = await EdgeFunctionsService.getInstance().createLeague({
  name: "City Soccer League",
  sport_type: "soccer",
  league_type: "recreational"
});
```

### Real-Time Match Tracking
```typescript
import { useRealtimeMatch } from '@/lib/hooks/use-realtime-matches';

function MatchPage({ matchId }: { matchId: string }) {
  const { match, recentEvents, isConnected } = useRealtimeMatch(matchId);
  
  return (
    <div>
      <MatchCard match={match} variant="live" />
      {recentEvents.map(event => (
        <div key={event.id}>{event.eventType}: {event.playerName}</div>
      ))}
    </div>
  );
}
```

### Authentication
```typescript
import { useAuth } from '@/components/auth/auth-provider';

function LoginComponent() {
  const { signIn, signUp, user, isAuthenticated } = useAuth();
  
  const handleSignIn = async () => {
    const result = await signIn({
      email: "player@example.com",
      password: "password"
    });
    
    if (result.success) {
      // User signed in successfully
    }
  };
}
```

### Global Analytics
```typescript
import { AnalyticsService } from '@/lib/services/analytics.service';

// Get global leaderboards
const leaderboard = await AnalyticsService.getInstance().getGlobalLeaderboards({
  category: 'goals',
  timeframe: 'current_season',
  sportType: 'soccer'
});

// Compare player across leagues
const comparison = await AnalyticsService.getInstance().comparePlayerAcrossLeagues(userId);
```

## 🔧 Configuration Management

All configuration follows the LEVER principle through `ConfigService`:

```typescript
import { ConfigService } from '@/lib/services/config.service';

// Get league settings
const settings = await ConfigService.getInstance().getLeagueSettings();

// Get scoring rules
const scoring = await ConfigService.getInstance().getScoringRules();
```

## 📊 Professional Features

### Cross-League Comparisons
- Players can see their ranking across ALL leagues
- Compare performance with players from different leagues
- League strength analysis and recommendations

### Real-Time Updates
- Live match scores and events
- Team notifications
- Connection status monitoring
- Automatic data synchronization

### Achievement System
- Progress tracking for various milestones
- Rarity-based achievement classifications
- Visual badge system with beautiful animations
- Achievement leaderboards

### Professional UI/UX
- Consistent loading states using `LoadingDialog`
- Professional card designs with gradients and shadows
- Proper number formatting and date display
- Responsive design for all device sizes

## 🧪 Testing Strategy

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ProfessionalCard } from '@/components/ui/professional-card';

test('displays player stats correctly', () => {
  render(
    <ProfessionalCard
      title="Test Player"
      stats={[{ label: 'Goals', value: 15 }]}
    />
  );
  
  expect(screen.getByText('Test Player')).toBeInTheDocument();
  expect(screen.getByText('15')).toBeInTheDocument();
});
```

### Service Testing
```typescript
import { ConfigService } from '@/lib/services/config.service';

test('returns default scoring rules when database unavailable', async () => {
  const rules = await ConfigService.getInstance().getScoringRules();
  expect(rules.win).toBe(3);
  expect(rules.draw).toBe(1);
  expect(rules.loss).toBe(0);
});
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Supabase Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy create-league
supabase functions deploy record-match-result
# ... deploy all other functions
```

## 📈 Performance Optimization

### TanStack Query Configuration
- Stale time set to 5 minutes for most queries
- Real-time subscriptions for live data
- Optimistic updates for better UX

### Database Optimization
- Proper indexes for common queries
- Row Level Security for security without performance loss
- Views for complex aggregations

### Component Optimization
- React.memo for expensive components
- Proper dependency arrays in useEffect
- Virtual scrolling for large lists

## 🔮 Future Enhancements

### Planned Features
1. **Mobile App** - React Native version
2. **Advanced Analytics** - Machine learning insights
3. **Tournament Management** - Bracket creation and management
4. **Social Features** - Player messaging and team communication
5. **Video Integration** - Match highlights and analysis
6. **Referee Tools** - Digital scorekeeping and event tracking

### Extensibility
The LEVER Framework architecture makes it easy to:
- Add new sports types
- Extend achievement systems
- Create custom analytics
- Integrate with external services
- Scale to handle more users

## 🤝 Contributing

### Code Standards
- Follow LEVER Framework principles
- Use TypeScript for type safety
- Write tests for new components
- Document public APIs
- Follow conventional commit messages

### Pull Request Process
1. Create feature branch from main
2. Implement following LEVER principles
3. Add tests for new functionality
4. Update documentation
5. Submit PR with descriptive title and body

---

**Built with ❤️ following the LEVER Framework for scalable, maintainable amateur sports applications.**