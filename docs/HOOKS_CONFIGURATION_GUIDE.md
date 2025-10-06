# Hooks Configuration Guide

This guide explains the hooks configuration patterns used in modern development workflows, covering both Git hooks for automated code quality checks and custom React hooks for state management.

## Table of Contents

1. [Git Hooks with Husky and lint-staged](#git-hooks-with-husky-and-lint-staged)
2. [Custom React Hooks Pattern](#custom-react-hooks-pattern)
3. [Implementation Guide](#implementation-guide)

---

## Git Hooks with Husky and lint-staged

### What are Git Hooks?

Git hooks are scripts that run automatically at specific points in the Git workflow (e.g., before committing, before pushing). They help maintain code quality by automatically running checks and formatting before code is committed to the repository.

### Configuration Overview

The Git hooks configuration uses two key tools:

- **Husky**: Manages Git hooks in a simple, shareable way
- **lint-staged**: Runs linters and formatters only on staged files (files about to be committed)

### Package Dependencies

```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^15.2.11",
    "prettier": "^3.4.2",
    "eslint": "^9",
    "eslint-config-next": "15.4.6"
  }
}
```

### lint-staged Configuration

The `lint-staged` configuration in `package.json` defines which commands run on which file types:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

**What this does:**

- **JavaScript/TypeScript files** (`*.{js,jsx,ts,tsx}`):
  1. Runs ESLint with auto-fix enabled to catch and fix code quality issues
  2. Runs Prettier to format code consistently

- **Configuration and documentation files** (`*.{json,md,css}`):
  1. Runs Prettier to ensure consistent formatting

### NPM Scripts

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write ."
  }
}
```

- `lint`: Runs ESLint to check for issues
- `lint:fix`: Runs ESLint and automatically fixes issues
- `format`: Formats all files in the project with Prettier

---

## Custom React Hooks Pattern

### What are Custom React Hooks?

Custom React hooks are reusable functions that encapsulate stateful logic and side effects. They follow React's rules of hooks and allow you to share logic between components without changing component hierarchy.

### Hook Naming Convention

All custom hooks must:
- Start with the prefix `use` (e.g., `useUserStats`, `useRecentActivity`)
- Follow camelCase naming convention
- Be descriptive of their purpose

### Standard Hook Pattern

#### Basic Structure

```typescript
export function useCustomHook(param: string | null) {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!param) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch data logic here
        const response = await fetch('/api/endpoint');

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [param]);

  return { data, loading, error, refetch: () => setLoading(true) };
}
```

#### Key Features

1. **State Management**: Uses `useState` for data, loading, and error states
2. **Side Effects**: Uses `useEffect` to fetch data when dependencies change
3. **Error Handling**: Comprehensive try-catch blocks with user-friendly error messages
4. **Null Safety**: Checks for null parameters before making API calls
5. **Refetch Capability**: Returns a refetch function to manually trigger data reload
6. **Type Safety**: TypeScript interfaces for data types and return values

### Hook Examples from the Project

#### 1. Data Fetching Hook

```typescript
/**
 * Hook for fetching user dashboard statistics with multi-team support
 */
export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [multiTeamContext, setMultiTeamContext] = useState<MultiTeamContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setTeamStats([]);
      setMultiTeamContext(null);
      setLoading(false);
      return;
    }

    async function fetchUserStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/user/stats');

        if (!response.ok) {
          throw new Error(`Failed to fetch user stats: ${response.status}`);
        }

        const data = await response.json();
        setStats(data.stats);
        setTeamStats(data.teamStats || []);
        setMultiTeamContext(data.multiTeamContext || null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [userId]);

  return {
    stats,
    teamStats,
    multiTeamContext,
    loading,
    error,
    refetch: () => setLoading(true)
  };
}
```

**Use case**: Fetching and managing multiple related data sets with a single hook

#### 2. Parameterized Hook

```typescript
/**
 * Hook for fetching user's recent activity
 */
export function useRecentActivity(userId: string | null, limit: number = 10) {
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setActivity([]);
      setLoading(false);
      return;
    }

    async function fetchRecentActivity() {
      try {
        setLoading(true);
        setError(null);

        // Complex data aggregation logic
        const activities: RecentActivity[] = [];

        // Fetch from multiple sources
        const { data: teamMemberships } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false })
          .limit(5);

        // Process and combine data
        teamMemberships?.forEach(membership => {
          activities.push({
            id: `team_${membership.id}`,
            type: 'team_joined',
            title: `Joined ${membership.team.name}`,
            timestamp: membership.joined_at,
          });
        });

        // Sort and limit results
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        setActivity(sortedActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivity();
  }, [userId, limit]);

  return { activity, loading, error, refetch: () => setLoading(true) };
}
```

**Use case**: Hooks with multiple parameters and default values for flexible data fetching

### TypeScript Interfaces for Hooks

Always define clear interfaces for your hook data structures:

```typescript
export interface DashboardStats {
  matchesPlayed: number;
  teamsJoined: number;
  upcomingMatches: number;
  winRate: number;
  goalsScored: number;
  assists: number;
  leaguesParticipated: number;
  avgTeamWinRate?: number;
}

export interface UserTeamMembership {
  team: {
    id: string;
    name: string;
    league?: { id: string; name: string } | null;
    captain_id?: string;
    memberCount: number;
    availableSpots: number;
  };
  role: 'captain' | 'member';
  position?: string;
  jerseyNumber?: number;
  joinedAt: string;
  stats?: {
    goals: number;
    assists: number;
    matches: number;
  };
}
```

---

## Implementation Guide

### Setting Up Git Hooks in a New Project

#### Step 1: Install Dependencies

```bash
npm install --save-dev husky lint-staged prettier eslint
```

#### Step 2: Initialize Husky

```bash
npx husky init
```

This creates a `.husky` directory with Git hook scripts.

#### Step 3: Create Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Make it executable:

```bash
chmod +x .husky/pre-commit
```

#### Step 4: Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

#### Step 5: Add NPM Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "prepare": "husky"
  }
}
```

The `prepare` script ensures Husky is installed when someone clones your repository.

### Creating Custom React Hooks

#### Step 1: Create Hooks Directory

```bash
mkdir -p src/hooks
```

#### Step 2: Create Hook File

Create a file like `src/hooks/useDashboardData.ts`:

```typescript
'use client'; // If using Next.js App Router

import { useState, useEffect } from 'react';

export function useCustomData(id: string | null) {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/data/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  return { data, loading, error, refetch: () => setLoading(true) };
}
```

#### Step 3: Use Hook in Components

```typescript
import { useCustomData } from '@/hooks/useDashboardData';

export function MyComponent({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = useCustomData(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Best Practices

#### Git Hooks Best Practices

1. **Keep hooks fast**: Only run checks on staged files using lint-staged
2. **Auto-fix when possible**: Use `--fix` flags to automatically resolve issues
3. **Fail gracefully**: Provide clear error messages when hooks fail
4. **Share with team**: Commit `.husky` directory to version control
5. **Document clearly**: Add comments explaining what each hook does

#### React Hooks Best Practices

1. **Follow naming convention**: Always prefix custom hooks with `use`
2. **Single responsibility**: Each hook should do one thing well
3. **Consistent return pattern**: Return objects with data, loading, error, and refetch
4. **Handle edge cases**: Check for null/undefined parameters
5. **Type everything**: Use TypeScript interfaces for all data structures
6. **Document thoroughly**: Add JSDoc comments explaining hook purpose and usage
7. **Error handling**: Always wrap async operations in try-catch blocks
8. **Dependency arrays**: Always specify correct dependencies in useEffect
9. **Client-side only**: Mark hooks with 'use client' directive in Next.js App Router
10. **Refetch capability**: Provide a way to manually trigger data reload

### Troubleshooting

#### Git Hooks Issues

**Problem**: Hooks not running
- **Solution**: Ensure hooks are executable: `chmod +x .husky/pre-commit`
- **Solution**: Run `npm run prepare` to reinstall Husky

**Problem**: Lint-staged failing
- **Solution**: Check that all tools (eslint, prettier) are installed
- **Solution**: Test commands individually: `npx eslint .` and `npx prettier --check .`

#### React Hooks Issues

**Problem**: Hooks causing infinite re-renders
- **Solution**: Check useEffect dependency arrays for missing or incorrect dependencies
- **Solution**: Ensure state setters are not called unconditionally

**Problem**: Stale data in hooks
- **Solution**: Implement proper dependency tracking in useEffect
- **Solution**: Use refetch function to manually update data

**Problem**: Type errors
- **Solution**: Ensure all interfaces are properly defined and exported
- **Solution**: Use proper null checks and optional chaining

---

## Summary

This configuration provides:

1. **Automated Code Quality**: Git hooks ensure code is linted and formatted before commits
2. **Reusable Logic**: Custom React hooks encapsulate complex data fetching and state management
3. **Type Safety**: TypeScript interfaces provide compile-time type checking
4. **Developer Experience**: Automated checks catch issues early, while clear patterns make code maintainable

By following these patterns, you can implement robust hooks in any project, ensuring code quality and maintainable state management across your application.
