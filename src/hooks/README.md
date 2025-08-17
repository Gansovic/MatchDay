# MatchDay Custom Hooks

This directory contains custom React hooks for the MatchDay application. These hooks encapsulate common patterns and provide reusable functionality across components.

## Hook Categories

### 🔧 Utility Hooks
**General-purpose hooks for common React patterns**

- **`useApi`** - Generic API calling with caching, retries, and loading states
- **`useAsync`** - Async operation management with cleanup
- **`useDebounce`** - Delay function execution for performance optimization
- **`useLocalStorage`** - Reactive localStorage with SSR safety
- **`useToggle`** - Boolean state management with toggle functionality
- **`useForm`** - Complete form management with validation

### 🏈 Domain-Specific Hooks
**MatchDay-specific functionality**

- **`useTeam`** - Team data fetching and management
- **`useLeague`** - League data and search functionality
- **`useUserProfile`** - User profile management
- **`useDashboardData`** - Dashboard statistics and data

## Quick Start Examples

### 1. Fetching Team Data
```tsx
import { useTeam } from '@/hooks';

function TeamProfile({ teamId }: { teamId: string }) {
  const { data: team, loading, error, refetch } = useTeam(teamId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div>
      <h1>{team.name}</h1>
      <p>League: {team.league?.name}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### 2. Form Management
```tsx
import { useForm } from '@/hooks';

function CreateTeamForm() {
  const {
    values,
    errors,
    getFieldProps,
    handleSubmit,
    isValid
  } = useForm({
    initialValues: {
      name: '',
      description: ''
    },
    validationRules: {
      name: { required: true, minLength: 3 },
      description: { maxLength: 200 }
    },
    onSubmit: async (values) => {
      await createTeam(values);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...getFieldProps('name')} placeholder="Team name" />
      {errors.name && <span>{errors.name}</span>}
      
      <textarea {...getFieldProps('description')} placeholder="Description" />
      {errors.description && <span>{errors.description}</span>}
      
      <button type="submit" disabled={!isValid}>
        Create Team
      </button>
    </form>
  );
}
```

### 3. Search with Debouncing
```tsx
import { useLeagueSearch, useDebouncedState } from '@/hooks';

function LeagueSearch() {
  const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('', 300);
  const { leagues, loading } = useLeagueSearch(debouncedSearchTerm, {
    sport_type: 'soccer'
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search leagues..."
      />
      
      {loading && <div>Searching...</div>}
      
      {leagues.map(league => (
        <div key={league.id}>{league.name}</div>
      ))}
    </div>
  );
}
```

### 4. Boolean State Management
```tsx
import { useToggle, useBoolean } from '@/hooks';

function Modal() {
  const [isOpen, toggleModal] = useToggle(false);
  const notifications = useBoolean(true);

  return (
    <>
      <button onClick={toggleModal}>
        {isOpen ? 'Close' : 'Open'} Modal
      </button>
      
      <button onClick={notifications.toggle}>
        Notifications: {notifications.value ? 'On' : 'Off'}
      </button>
      
      {isOpen && (
        <div className="modal">
          <h2>Modal Content</h2>
          <button onClick={() => toggleModal(false)}>Close</button>
        </div>
      )}
    </>
  );
}
```

### 5. Local Storage Persistence
```tsx
import { useLocalStorage } from '@/hooks';

function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'en');

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
    </div>
  );
}
```

## Hook Benefits

### 🚀 **Reusability**
Write logic once, use it everywhere. No more copying and pasting the same data fetching code.

### 🧹 **Clean Components**
Components focus on rendering, hooks handle the logic. Much easier to read and maintain.

### 🧪 **Testability**
Hooks can be tested independently from components, making your tests more focused.

### 📦 **Encapsulation**
Related logic stays together. All team operations in `useTeam`, all form logic in `useForm`.

### ⚡ **Performance**
Built-in optimizations like caching, debouncing, and memoization improve your app's performance.

## Best Practices

### 1. Import from Index
```tsx
// ✅ Good - use the index file
import { useTeam, useForm } from '@/hooks';

// ❌ Avoid - direct imports
import { useTeam } from '@/hooks/useTeam';
```

### 2. Handle Loading and Error States
```tsx
function MyComponent() {
  const { data, loading, error } = useTeam(teamId);

  // Always handle these states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return <TeamDisplay team={data} />;
}
```

### 3. Use Dependency Arrays Correctly
```tsx
// ✅ Include all dependencies
const { data } = useApi(
  () => fetchTeamData(teamId, season),
  [teamId, season]  // Include both teamId and season
);
```

### 4. Combine Hooks for Complex Logic
```tsx
function ComplexComponent() {
  const { data: user } = useUserProfile();
  const { data: teams } = useUserTeams();
  const [selectedTeam, setSelectedTeam] = useLocalStorage('selectedTeam', null);
  const [showModal, toggleModal] = useToggle(false);

  // Combine multiple hooks for rich functionality
}
```

## Custom Hook Creation

When creating new hooks, follow these patterns:

### Basic Structure
```tsx
export function useMyHook(param: string) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook logic here

  return {
    data: state,
    loading,
    error,
    refetch: () => {}, // Always provide a refetch function
    // Other useful functions
  };
}
```

### With TypeScript
```tsx
interface MyHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMyHook<T>(param: string): MyHookResult<T> {
  // Implementation
}
```

Happy coding! 🚀