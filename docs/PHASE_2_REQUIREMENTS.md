# Phase 2: Core Features - REVISED (Based on Existing Code)

## What's Already Built ✅

After code analysis, we discovered **90% of the statistics infrastructure already exists**:

### StatsService (1200+ lines) ✅
- ✅ `getPlayerPerformanceAnalysis()` - Complete performance analysis
- ✅ `getGlobalRankings()` - Global leaderboards
- ✅ `getCrossLeagueComparison()` - Cross-league comparisons
- ✅ `getLeagueAnalytics()` - League analytics
- ✅ `getPerformanceTrends()` - Trend calculations
- ✅ Caching system for performance
- ✅ Error handling

### Database Schema ✅
- ✅ `player_stats` table
- ✅ `player_cross_league_stats` table
- ✅ `player_leaderboard` view
- ✅ `league_standings` table

### What's Missing (The 10%)

The missing pieces are:
1. **Automated stat calculation trigger** when matches are created
2. **UI components** to display the stats
3. **Achievement detection logic** implementation
4. **Testing**

---

## Phase 2: Actual Work Needed (2-3 weeks)

### Week 1: Connect the Pieces (Automation)

#### Task 1.1: Automated Stat Tracking (2 days)
**What:** Trigger stat calculation when match is created/updated

**Implementation:**
1. Update `/src/app/api/matches/route.ts` POST method
2. After match is saved, call StatsService to update player stats
3. Update both individual `player_stats` and aggregated `player_cross_league_stats`

**Code to add:**
```typescript
// In POST /api/matches after match creation
const supabase = await createServerSupabaseClient();

// Get match participants (from team rosters)
const { data: homeTeamMembers } = await supabase
  .from('team_members')
  .select('user_id')
  .eq('team_id', match.home_team_id)
  .eq('is_active', true);

const { data: awayTeamMembers } = await supabase
  .from('team_members')
  .select('user_id')
  .eq('team_id', match.away_team_id)
  .eq('is_active', true);

// Update stats for all participants
const allPlayers = [
  ...(homeTeamMembers?.map(m => m.user_id) || []),
  ...(awayTeamMembers?.map(m => m.user_id) || [])
];

await Promise.all(
  allPlayers.map(playerId =>
    updatePlayerStatsAfterMatch(playerId, match.id)
  )
);
```

**Files to modify:**
- `/src/app/api/matches/route.ts` - Add POST method with stat updates
- `/src/lib/services/stats.service.ts` - Add `updatePlayerStatsAfterMatch()` method

**Acceptance Criteria:**
- [ ] When match is created, all player stats update automatically
- [ ] Goals, assists, matches played, win/loss recorded
- [ ] Cross-league stats aggregated correctly
- [ ] Works for both new and existing matches

---

### Week 2: Build the UI (Visualization)

#### Task 2.1: Match History Component (2 days)
**What:** Display player's complete match history

**Create:** `/src/components/player/MatchHistory.tsx`

**Features:**
- List all past matches with date, opponent, score, result
- Filter by season, league, team
- Pagination (20 per page)
- Shows personal stats for each match (if available)

**Data Source:** Already exists in StatsService

**Acceptance Criteria:**
- [ ] Shows all player's past matches
- [ ] Can filter and search
- [ ] Links to match details

#### Task 2.2: Performance Charts (2 days)
**What:** Visual charts showing performance over time

**Create:** `/src/components/player/PerformanceCharts.tsx`

**Charts to build:**
1. **Goals Over Time** - Line chart
2. **Win Rate Trend** - Area chart
3. **Form Guide** - Last 10 matches visual (W/D/L)
4. **Season Comparison** - Bar chart

**Library:** Use Recharts (already installed via TanStack)

**Data Source:** `StatsService.getPerformanceTrends()`

**Acceptance Criteria:**
- [ ] 4 different chart types displayed
- [ ] Responsive and interactive
- [ ] Can toggle between different time periods

#### Task 2.3: Career Stats Summary (1 day)
**What:** Lifetime statistics display

**Create:** `/src/components/player/CareerStats.tsx`

**Display:**
- Total matches, goals, assists
- Overall win rate
- Best scoring streak
- Per-league breakdown
- Per-team breakdown

**Data Source:** `StatsService.getPlayerPerformanceAnalysis()`

**Acceptance Criteria:**
- [ ] Shows all career totals
- [ ] Breaks down by league/team
- [ ] Highlights milestones

#### Task 2.4: Cross-League Comparison UI (1 day)
**What:** Visual comparison across leagues

**Create:** `/src/components/player/CrossLeagueComparison.tsx`

**Features:**
- Table comparing stats across all leagues played
- Normalized performance metrics
- League difficulty indicators
- Radar chart for multi-league comparison

**Data Source:** `StatsService.getCrossLeagueComparison()`

**Acceptance Criteria:**
- [ ] Shows stats for each league
- [ ] Normalizes for league difficulty
- [ ] Visual radar chart

#### Task 2.5: Global Leaderboard Enhancement (1 day)
**What:** Enhance existing leaderboard component

**Modify:** `/src/components/features/global-leaderboard.tsx`

**Enhancements:**
- Add more stat categories (goals, assists, matches, performance)
- Add filtering by league, position, timeframe
- Add player's own rank highlight
- Add search functionality

**Data Source:** `StatsService.getGlobalRankings()` (already exists!)

**Acceptance Criteria:**
- [ ] Multiple leaderboard categories
- [ ] Can filter/search
- [ ] Shows user's rank prominently

---

### Week 3: Achievements & Notifications

#### Task 3.1: Achievement Definitions (1 day)
**What:** Define all achievement types in code

**Create:** `/src/lib/constants/achievements.ts`

**Categories (20+ achievements):**

```typescript
export const ACHIEVEMENTS = {
  // Scoring
  FIRST_GOAL: {
    id: 'first_goal',
    name: 'First Goal',
    description: 'Score your first goal',
    icon: '⚽',
    rarity: 'common',
    criteria: { goals: 1 }
  },
  HAT_TRICK: {
    id: 'hat_trick',
    name: 'Hat Trick',
    description: 'Score 3 goals in one match',
    icon: '🎩',
    rarity: 'rare',
    criteria: { goalsInMatch: 3 }
  },
  // ... 18+ more achievements
};
```

**Acceptance Criteria:**
- [ ] All achievement types defined
- [ ] Each has clear criteria
- [ ] Icons and rarity assigned

#### Task 3.2: Achievement Detection (2 days)
**What:** Detect and award achievements automatically

**Create:** `/src/lib/services/achievement-detector.service.ts`

**Methods:**
```typescript
async detectAndAwardAchievements(playerId: string, matchId: string)
async checkScoringAchievements(playerId: string, matchStats: any)
async checkCareerAchievements(playerId: string)
async awardAchievement(playerId: string, achievementId: string)
```

**Logic:**
- Run after each match stat update
- Check match-specific achievements (hat trick, etc.)
- Check career achievements (milestones, etc.)
- Insert into `player_achievements` table
- Trigger notification

**Files to modify:**
- `/src/app/api/matches/route.ts` - Call detector after stats update

**Acceptance Criteria:**
- [ ] Achievements detected automatically
- [ ] No duplicates awarded
- [ ] Works for historical matches

#### Task 3.3: Achievement Showcase UI (1 day)
**What:** Display earned achievements

**Enhance:** `/src/components/features/achievement-showcase.tsx`

**Features:**
- Grid of earned achievements
- Locked achievements shown as shadows
- Progress bars for incremental achievements
- Filter by category, rarity
- Achievement detail modal

**Acceptance Criteria:**
- [ ] Shows all earned achievements
- [ ] Progress for locked achievements
- [ ] Can filter/sort

#### Task 3.4: In-App Notifications (1 day)
**What:** Notify players of new achievements

**Create:**
- `/src/components/notifications/NotificationBell.tsx`
- `/src/components/notifications/NotificationCenter.tsx`
- `/src/app/api/notifications/route.ts`

**Notification Types:**
- New achievement earned
- Match result recorded
- Moved up in leaderboard

**Database:**
- Create `notifications` table

**Acceptance Criteria:**
- [ ] Bell icon shows unread count
- [ ] Notification center lists all
- [ ] Can mark as read
- [ ] Links to relevant content

---

### Week 4: Testing & Polish

#### Task 4.1: Service Tests (2 days)
**What:** Test all services thoroughly

**Complete tests for:**
- ✅ TeamService (template exists - implement)
- ✅ MatchService (template exists - implement)
- ❌ LeagueService
- ❌ PlayerService
- ❌ StatsService (CRITICAL - most complex)
- ❌ SeasonService
- ❌ AchievementService
- ❌ AnalyticsService
- ❌ ConfigService

**Target:** 90%+ coverage per service

**Acceptance Criteria:**
- [ ] All 9 services tested
- [ ] 90%+ coverage each
- [ ] Edge cases covered

#### Task 4.2: Component Tests (1 day)
**What:** Test critical UI components

**Test:**
- PerformanceCharts
- MatchHistory
- CareerStats
- AchievementShowcase
- CrossLeagueComparison

**Acceptance Criteria:**
- [ ] All new components tested
- [ ] User interactions verified
- [ ] Data rendering checked

#### Task 4.3: Integration Tests (1 day)
**What:** Test complete flows

**Test Flows:**
1. Create match → stats update → achievement awarded
2. View match history → see stats
3. Check leaderboard → see ranking
4. Earn achievement → get notification

**Acceptance Criteria:**
- [ ] 4+ flows tested E2E
- [ ] Database updates verified
- [ ] UI updates verified

#### Task 4.4: Bug Fixes & Polish (1 day)
**What:** Fix bugs, improve UX

**Tasks:**
- Fix any bugs found during testing
- Improve loading states
- Add error handling
- Optimize performance
- Mobile responsiveness

**Acceptance Criteria:**
- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Mobile-friendly

---

## Summary: What We're Actually Building

### Week 1: Automation (Already 90% done!)
- ✅ StatsService exists
- ❌ Add trigger to call it after match creation
- ❌ Add `updatePlayerStatsAfterMatch()` method

### Week 2: UI (All net new)
- ❌ MatchHistory component
- ❌ PerformanceCharts component
- ❌ CareerStats component
- ❌ CrossLeagueComparison component
- ❌ Enhance GlobalLeaderboard

### Week 3: Achievements (50% done)
- ✅ AchievementService exists
- ❌ Define achievement types
- ❌ Implement detection logic
- ❌ Enhance showcase UI
- ❌ Add notifications

### Week 4: Testing
- ❌ Complete service tests
- ❌ Component tests
- ❌ Integration tests
- ❌ Bug fixes

---

## Files to Create

### New Files (12 files)
1. `/src/components/player/MatchHistory.tsx`
2. `/src/components/player/PerformanceCharts.tsx`
3. `/src/components/player/CareerStats.tsx`
4. `/src/components/player/CrossLeagueComparison.tsx`
5. `/src/lib/constants/achievements.ts`
6. `/src/lib/services/achievement-detector.service.ts`
7. `/src/components/notifications/NotificationBell.tsx`
8. `/src/components/notifications/NotificationCenter.tsx`
9. `/src/app/api/notifications/route.ts`
10. `/tests/unit/services/stats.service.test.ts`
11. `/tests/unit/services/achievement.service.test.ts`
12. `/tests/integration/match-stats-flow.test.ts`

### Files to Modify (4 files)
1. `/src/app/api/matches/route.ts` - Add POST with stat updates
2. `/src/lib/services/stats.service.ts` - Add update method
3. `/src/components/features/global-leaderboard.tsx` - Enhance
4. `/src/components/features/achievement-showcase.tsx` - Enhance

---

## Success Metrics

**Must Achieve:**
- [ ] Stats auto-update when matches are created
- [ ] Players can see complete match history
- [ ] Performance charts show trends
- [ ] Career stats displayed prominently
- [ ] Cross-league comparisons working
- [ ] Achievements auto-detected and awarded
- [ ] In-app notifications working
- [ ] 80%+ test coverage

---

## Revised Timeline: 3 Weeks (Not 6!)

**Week 1:** Automation + Match History + Charts
**Week 2:** Stats UI + Cross-League + Achievements
**Week 3:** Notifications + Testing + Polish

---

## Let's Start! 🚀

**First Task:** Add automated stat tracking after match creation

Shall we begin with updating `/src/app/api/matches/route.ts` to add the POST method with stat calculation?
