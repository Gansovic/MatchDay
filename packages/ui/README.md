# @matchday/ui

Shared UI component library for MatchDay platform (Admin and Player apps).

## Overview

This package provides reusable React components and layouts that are shared between the `@matchday/admin` and `@matchday/player` applications. By extracting common UI elements into a shared package, we eliminate code duplication and ensure consistent design across both apps.

## Structure

```
packages/ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   ├── stats-card.tsx
│   │   ├── status-badge.tsx
│   │   └── ... (more components)
│   ├── layouts/             # Page layout components
│   │   └── SeasonDashboardLayout.tsx
│   └── index.ts             # Main export file
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

This package is part of the monorepo workspace and is installed automatically:

```bash
pnpm install
```

## Usage

Import components from `@matchday/ui`:

```tsx
import { Button, Card, SeasonDashboardLayout } from '@matchday/ui';
```

## Components

### Layouts

#### SeasonDashboardLayout

A comprehensive layout component for season dashboard pages. Provides consistent header, navigation, and structure across admin and player apps.

**Features:**
- Responsive gradient background
- Season header with icon, title, and status badge
- Metadata display (season name, dates, team count)
- Tab navigation
- Loading and error states
- Customizable slots for app-specific content

**Data Fetching Strategy:**
This layout component does NOT fetch data internally. Apps must fetch data using their own Supabase client implementation and pass it via props. This ensures flexibility and proper separation of concerns.

**Example Usage:**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { SeasonDashboardLayout, TabConfig } from '@matchday/ui';
import { Info, Users, Calendar, Trophy } from 'lucide-react';
import { SeasonIcon } from '@/components/ui/season-icon';

export default function MySeasonPage() {
  const [season, setSeason] = useState(null);
  const [league, setLeague] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data using your app's Supabase client
  useEffect(() => {
    const fetchData = async () => {
      // Your data fetching logic here
      const seasonData = await fetchSeason();
      const leagueData = await fetchLeague();

      setSeason(seasonData);
      setLeague(leagueData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'standings', label: 'Standings', icon: Trophy }
  ];

  return (
    <SeasonDashboardLayout
      backLink={{
        href: `/leagues/${leagueId}`,
        label: 'Back to League'
      }}
      season={season}
      league={league}
      isLoading={isLoading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      seasonIcon={
        season && league && (
          <SeasonIcon
            seasonId={season.id}
            leagueId={league.id}
            seasonName={season.display_name || season.name}
            size="xl"
          />
        )
      }
    >
      {/* Your tab content goes here */}
      {activeTab === 'overview' && <OverviewContent />}
      {activeTab === 'teams' && <TeamsContent />}
      {/* ... more tabs */}
    </SeasonDashboardLayout>
  );
}
```

**Props Interface:**

```typescript
interface SeasonDashboardLayoutProps {
  // Navigation
  backLink: {
    href: string;
    label: string;
  };

  // Data (apps handle fetching and pass via props)
  season: Season | null;
  league: League | null;

  // Loading and error states
  isLoading?: boolean;
  error?: string | null;

  // Tab configuration
  tabs: TabConfig[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;

  // Optional customization slots
  headerActions?: React.ReactNode;
  seasonIcon?: React.ReactNode;
  title?: string;

  // Content
  children: React.ReactNode;
}
```

**Type Definitions:**

```typescript
interface Season {
  id: string;
  name: string;
  display_name?: string;
  status: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  registered_teams_count?: number;
}

interface League {
  id: string;
  name: string;
  sport_type: string;
  description?: string;
  teamCount?: number;
}

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon; // from lucide-react
}
```

### Basic Components

See existing component files in `src/components/` for documentation on:
- `Button` - Reusable button component
- `Card` - Card container component
- `Alert` - Alert/notification component
- `StatsCard` - Statistics display card
- `StatusBadge` - Status indicator badge
- `ProgressBar` - Progress indicator
- `EmptyState` - Empty state placeholder
- And more...

## Dependencies

### Workspace Dependencies
- `@matchday/shared` - Shared utilities
- `@matchday/database` - Database types

### Peer Dependencies
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `next` ^15.0.0
- `lucide-react` ^0.400.0 || ^0.500.0

**Note:** Peer dependencies must be installed in the consuming app.

## Development

### Type Checking
```bash
pnpm --filter @matchday/ui type-check
```

### Building
```bash
pnpm --filter @matchday/ui build
```

## Design Principles

1. **Data Fetching Separation**: Layout components don't fetch data internally. Apps pass data via props.

2. **Composition Over Configuration**: Use slots (React children/nodes) for customization rather than props for every detail.

3. **Consistent Styling**: All components use Tailwind CSS v4 with dark mode support.

4. **Type Safety**: Full TypeScript support with exported types.

5. **Accessibility**: Components follow WCAG guidelines with proper ARIA attributes.

## Migration Guide

### Replacing Duplicated SeasonDashboardLayout

If you have an existing `SeasonDashboardLayout` in your app:

1. **Install the shared component:**
   ```tsx
   import { SeasonDashboardLayout } from '@matchday/ui';
   ```

2. **Fetch data in your page component:**
   ```tsx
   // Instead of fetching inside the layout, fetch in your page
   const [season, setSeason] = useState(null);
   const [league, setLeague] = useState(null);

   useEffect(() => {
     fetchSeasonData().then(setSeason);
     fetchLeagueData().then(setLeague);
   }, []);
   ```

3. **Pass data as props:**
   ```tsx
   <SeasonDashboardLayout
     season={season}
     league={league}
     // ... other props
   />
   ```

4. **Handle app-specific components separately:**
   - `SeasonIcon`: Keep in your app (uses app-specific API routes)
   - Pass it via the `seasonIcon` prop

## Future Enhancements

- [ ] Storybook documentation
- [ ] Unit tests with Vitest
- [ ] Additional shared layouts (LeagueDashboardLayout, etc.)
- [ ] Form components
- [ ] Modal/Dialog components
- [ ] More dashboard widgets

## Contributing

When adding new components:

1. Create the component in `src/components/` or `src/layouts/`
2. Export it from `src/index.ts`
3. Update this README with usage examples
4. Ensure TypeScript types are exported
5. Add dark mode support
6. Follow existing naming conventions

## Questions?

Contact the MatchDay development team for questions about this package.
