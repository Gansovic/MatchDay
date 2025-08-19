# TravelBuddies Engineering Principles

**THIS DOCUMENT IS MANDATORY FOR ALL ENGINEERS INCLUDING AI ASSISTANTS**

## The LEVER Framework - NON-NEGOTIABLE

Every line of code in TravelBuddies MUST follow LEVER principles. No exceptions.

### L - Leverage Existing Patterns

**DO:**
```typescript
// Use ConfigService for ALL configuration
const config = await ConfigService.getInstance().getPointsConfiguration();

// Use EdgeFunctionsService for ALL server calls
const result = await EdgeFunctionsService.getInstance().processTrip(...);

// Use existing UI components
await LoadingDialog.show({
  title: 'Processing',
  message: 'Processing your trip...',
  operation: () => edgeFunctionsService.processTrip(trip),
});
```

**DON'T:**
```typescript
// NEVER access Supabase directly without proper service
const { data } = await supabase.from('configs').select('*').single(); // WRONG

// NEVER create custom loading patterns
return <div className="spinner">Loading...</div>; // WRONG

// NEVER bypass existing services
const result = await supabase.functions.invoke('processTrip'); // WRONG - use EdgeFunctionsService
```

**EXISTING PATTERNS TO LEVERAGE:**
- `ConfigService` - ALL configuration fetching ✅ IMPLEMENTED
- `EdgeFunctionsService` - ALL server communication ✅ IMPLEMENTED
- `DataConverters` - ALL type conversions ✅ IMPLEMENTED  
- `NumberFormatters` - ALL number display ✅ IMPLEMENTED
- `LoadingDialog/LoadingOverlay` - ALL loading states ✅ IMPLEMENTED
- `PaginatedDataProvider` - ALL paginated data ✅ IMPLEMENTED
- `TripService` - ALL trip operations (CRUD, search, stats) ✅ IMPLEMENTED
- `AppConstants/ConfigPaths` - ALL constants and paths ✅ IMPLEMENTED
- Polling Hooks - Real-time-like updates with TanStack Query
- `AppConfig` - Application configuration from environment
- `ErrorDisplay/EmptyStateDisplay` - Consistent error and empty state UI

**MANDATORY: CREATING NEW REUSABLE PATTERNS**

When you MUST create new code (after confirming no existing pattern works):

```typescript
// STEP 1: Create as a reusable service/utility
class NewFeatureService {
  private static instance: NewFeatureService;
  
  private constructor() {}
  
  static getInstance(): NewFeatureService {
    if (!NewFeatureService.instance) {
      NewFeatureService.instance = new NewFeatureService();
    }
    return NewFeatureService.instance;
  }
  
  // Generic, reusable implementation
  async performOperation<T>(parameters: any): Promise<T> {
    // Implementation
  }
}

// STEP 2: Document the pattern
/**
 * Service for handling [specific functionality]
 * 
 * @example
 * ```typescript
 * const result = await NewFeatureService.getInstance().performOperation(data);
 * ```
 * 
 * This service should be used for ALL [type] operations.
 */

// STEP 3: Add to this PRINCIPLES.md document under "EXISTING PATTERNS TO LEVERAGE"
```

**RULES FOR NEW CODE:**
1. MUST be created as a reusable service/utility/component
2. MUST follow singleton pattern for services
3. MUST be generic enough for future use cases
4. MUST include usage documentation
5. MUST be added to PRINCIPLES.md for future engineers
6. MUST have unit tests demonstrating usage patterns

### E - Extend Before Creating

**DO:**
```typescript
// Extend existing base classes
class TripProvider extends PaginatedDataProvider<Trip> {
  async fetchPage(page: number): Promise<PaginatedResult<Trip>> {
    // Implementation
  }
}

// Extend existing interfaces
interface ExtendedTrip extends Trip {
  additionalField: string;
  // Additional properties
}
```

**DON'T:**
```typescript
// NEVER create parallel implementations
class MyCustomPaginationProvider { // WRONG - extend PaginatedDataProvider
  // Custom implementation
}

// NEVER duplicate functionality
class MyNumberFormatter { // WRONG - use NumberFormatters
  formatPoints(points: number): string {
    return points.toString();
  }
}
```

**EXTENSION POINTS:**
- `PaginatedDataProvider<T>` - For any paginated data
- `Trip` model - For trip extensions
- `ValidationResult` - For validation extensions
- UI components through composition, not inheritance

### V - Verify Through Reactivity

**DO:**
```typescript
// Use TanStack Query for reactive data
function useUserTrips(userId: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => TripService.getInstance().getUserTrips(userId),
    refetchInterval: 5000, // Poll for updates
  });
}

// Use React state for UI state
const [status, setStatus] = useState<DetectionStatus>();

// Update reactively
setStatus(newStatus);

// Use Supabase realtime for live updates
supabase
  .channel('trips')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, 
    () => queryClient.invalidateQueries(['trips']))
  .subscribe();
```

**DON'T:**
```typescript
// NEVER use manual polling for updates
setInterval(() => {
  fetchLatestData(); // WRONG - use TanStack Query
}, 5000);

// NEVER manage server state manually
const [trips, setTrips] = useState([]);
setTrips(fetchedTrips); // WRONG - use TanStack Query
```

**REACTIVE PATTERNS:**
- Supabase realtime subscriptions for live data
- TanStack Query for server state management
- React hooks for UI updates
- React Context for global state

### E - Eliminate Duplication

**DO:**
```typescript
// Centralize configuration
export const ConfigPaths = {
  pointsRules: 'app_configurations/points_rules_active',
  tripDetection: 'app_configurations/trip_detection_config',
} as const;

// Reuse validation logic
export class TripValidator {
  static validate(trip: Trip): ValidationResult {
    // Single validation implementation
  }
}

// Centralize constants
export const AppConstants = {
  edgeFunctionTimeout: 30,
  maxRetries: 3,
} as const;
```

**DON'T:**
```typescript
// NEVER duplicate strings
await supabase.from('app_configurations').select('*').eq('id', 'points_rules_active'); // WRONG
await supabase.from('app_configurations').select('*').eq('id', 'points_rules_active'); // Duplicated

// NEVER duplicate logic
if (trip.distance < 50) return false; // WRONG - use centralized validation
if (trip.distance < 50) return false; // Duplicated logic

// NEVER hardcode values
const timeout = 30000; // WRONG - use AppConstants
```

**CENTRALIZED COMPONENTS:**
- `DataConverters` - Type conversions
- `NumberFormatters` - Number formatting
- `ConfigService` - Configuration access
- `FraudDetectionService` - Validation logic
- `DialogDefaults` - Dialog styling

### R - Reduce Complexity

**DO:**
```typescript
// Simple, single-purpose methods
async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role === UserRole.Admin;
}

// Clear separation of concerns
class TripService {
  // Only handles trip reading
  async getUserTrips(userId: string): Promise<Trip[]> { }
}

class EdgeFunctionsService {
  // Only handles server communication
  async processTrip(trip: Trip): Promise<Record<string, any>> { }
}
```

**DON'T:**
```typescript
// NEVER create complex multi-purpose methods
async function handleTripAndUpdateUserAndSendNotification(trip: Trip): Promise<any> {
  // Too many responsibilities - WRONG
}

// NEVER nest deeply
if (condition1) {
  if (condition2) {
    if (condition3) { // WRONG - refactor to reduce nesting
      // Logic
    }
  }
}

// NEVER mix concerns
class TripService {
  async saveTrip() { } // WRONG - trips are saved via Edge Functions only
  async getTrips(): Promise<Trip[]> { } // Correct - read only
}
```

**COMPLEXITY REDUCTION PATTERNS:**
- Early returns to reduce nesting
- Single responsibility per class/method
- Composition over inheritance
- Server-side business logic

## Core Technical Rules

### 1. Server-Side Authority

**RULE:** ALL business logic MUST execute in Edge Functions

```typescript
// CLIENT (Next.js) - CORRECT
export function TripScreen() {
  async function saveTrip() {
    // Only collect data and call Edge Function
    const result = await EdgeFunctionsService.getInstance().processTrip({
      transportMode: selectedMode,
      distanceMeters: calculatedDistance,
      startTime,
      endTime,
    });
  }
}

// EDGE FUNCTION - CORRECT
// supabase/functions/process-trip/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { transportMode, distanceMeters, startTime, endTime } = await req.json();
  
  // ALL business logic here
  const points = calculatePoints(data);
  const co2Saved = calculateCO2(data);
  await updateUserStats(userId, points);
  await createAuditLog(userId, 'TRIP_PROCESSED', data);
  
  return new Response(
    JSON.stringify({ tripId, points, co2Saved }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**NEVER:**
```typescript
// CLIENT - WRONG
await supabase.from('users').update({
  current_balance: currentBalance + points, // NEVER update from client
}).eq('id', userId);
```

### 2. Configuration Management

**RULE:** ALL configuration MUST come from environment or ConfigService

```typescript
// CORRECT - Configuration hierarchy
class ConfigService {
  private static instance: ConfigService;
  private memoryCache = new Map();
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  async getConfig<T>(key: string): Promise<T> {
    // 1. Check memory cache
    if (this.memoryCache.has(key)) return this.memoryCache.get(key);
    
    // 2. Check local storage
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);
    
    // 3. Fetch from Supabase
    try {
      const { data } = await supabase
        .from('app_configurations')
        .select('*')
        .eq('key', key)
        .single();
      
      localStorage.setItem(key, JSON.stringify(data));
      this.memoryCache.set(key, data);
      return data;
    } catch (e) {
      // 4. Fall back to local storage or defaults
      return local ? JSON.parse(local) : this.getDefault(key);
    }
  }
}
```

**NEVER:**
```typescript
// WRONG - Hardcoded values
const pointsPerKm = 100; // NEVER hardcode

// WRONG - Direct Supabase access
const { data } = await supabase
  .from('app_configurations')
  .select('*')
  .eq('key', 'points_rules')
  .single(); // NEVER access directly
```

### 3. Data Type Conversion

**RULE:** ALL data exchange between client and server MUST use DataConverters

```typescript
// CLIENT - CORRECT
const result = await edgeFunction.invoke('processTrip', data);
const safeData = DataConverters.toTypedObject(result.data);
const trips = safeData.trips.map((item: any) => Trip.fromEdgeFunction(item));

// EDGE FUNCTION - CORRECT
const trips = DataConverters.queryResultToJson(queryResult);
return new Response(
  JSON.stringify({ 
    trips,
    totalPages: Math.ceil(totalCount / pageSize)
  }),
  { headers: { 'Content-Type': 'application/json' } }
);
```

**NEVER:**
```typescript
// WRONG - Direct casting
const data = result.data as Record<string, any>; // NEVER cast directly
```

### 4. UI Component Standards

**RULE:** ALL UI MUST use mandatory centralized components

```typescript
// LOADING STATES - CORRECT
import { LoadingDialog } from '@ui/components';

await LoadingDialog.show({
  title: 'Processing',
  message: 'Processing your trip...',
  estimatedDuration: 3000,
  operation: () => edgeFunctionsService.processTrip(trip),
});

// NUMBER FORMATTING - CORRECT
import { NumberFormatters } from '@utils/formatters';

<Text>{NumberFormatters.formatPoints(points)}</Text>
<Text>{NumberFormatters.formatDistance(distance)}</Text>

// DIALOGS - CORRECT
import { Dialog, DialogDefaults } from '@ui/components';

<Dialog
  {...DialogDefaults}
  open={isOpen}
  onClose={handleClose}
>
  <DialogContent className={DialogDefaults.contentClass}>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**NEVER:**
```typescript
// WRONG - Raw components
<div className="spinner">Loading...</div> // NEVER use directly

// WRONG - Manual formatting
<span>{points.toString()}</span> // NEVER format manually
<span>{`${distance.toFixed(1)} km`}</span> // NEVER format manually

// WRONG - Custom dialogs
<div className="modal"> // NEVER use without Dialog component
  {/* Custom modal content */}
</div>
```

### 5. Error Handling

**RULE:** ALL operations MUST handle errors consistently

```typescript
// CORRECT Pattern
import { toast } from '@ui/components';

async function safeOperation<T>(): Promise<T | null> {
  try {
    // Show loading
    return await LoadingDialog.show({
      title: 'Processing',
      message: 'Please wait...',
      operation: async () => {
        const result = await service.operation();
        return result;
      },
    });
  } catch (error) {
    // Log error
    console.error('Operation failed:', error);
    
    // Show user-friendly message
    toast.error('Something went wrong. Please try again.');
    
    return null;
  }
}
```

### 6. Testing Requirements

**RULE:** ALL new code MUST have tests. NO EXCEPTIONS.

```typescript
// MANDATORY Test Coverage:
// 1. Unit tests for ALL services
import { describe, it, expect, vi } from 'vitest';

describe('ConfigService', () => {
  it('should fetch from cache first', async () => {
    // Arrange
    const mockCache = new Map();
    mockCache.set('key', cachedValue);
    
    // Act
    const result = await configService.getConfig('key');
    
    // Assert
    expect(result).toEqual(cachedValue);
    expect(supabase.from).not.toHaveBeenCalled();
  });
  
  it('should fall back to Supabase when cache miss', async () => {
    // Test ALL code paths
  });
});

// 2. Component tests for ALL UI components
import { render, screen, fireEvent } from '@testing-library/react';

describe('LoadingDialog', () => {
  it('shows message', async () => {
    render(
      <Button 
        onClick={() => LoadingDialog.show({
          message: 'Testing',
          operation: async () => new Promise(resolve => setTimeout(resolve, 1000))
        })}
      >
        Test
      </Button>
    );
    
    fireEvent.click(screen.getByText('Test'));
    
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });
});

// 3. Integration tests for critical flows
it('processTrip should calculate points correctly', async () => {
  const result = await EdgeFunctionsService.getInstance().processTrip({
    transportMode: TransportMode.OnFoot,
    distanceMeters: 1000,
    startTime: new Date(Date.now() - 600000),
    endTime: new Date(),
  });
  
  expect(result.points).toBe(600); // 600 points per km on foot
});
```

**TESTING CHECKLIST:**
- [ ] Unit tests for ALL public methods
- [ ] Widget tests for ALL UI components
- [ ] Edge case tests (null, empty, invalid data)
- [ ] Error scenario tests
- [ ] Integration tests for Cloud Function calls
- [ ] Mock all external dependencies
- [ ] Test coverage > 80% for new code

**NO CODE MERGES WITHOUT TESTS**

### 7. Audit Logging

**RULE:** ALL operations involving value MUST create audit logs

```typescript
// EDGE FUNCTION - CORRECT
// supabase/functions/process-trip/index.ts
import { createClient } from '@supabase/supabase-js';

export async function processTrip(data: TripData, userId: string) {
  // Process trip
  const result = await createTrip(data);
  
  // MANDATORY audit log
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'TRIP_PROCESSED',
    metadata: {
      tripId: result.tripId,
      points: result.points,
      distance: data.distanceMeters,
      mode: data.transportMode
    },
    created_at: new Date().toISOString()
  });
  
  return result;
}
```

**Operations requiring audit logs:**
- Trip processing
- Expense transactions
- User profile changes
- Settlement operations
- Itinerary modifications
- Member management

## Additional Mandatory Practices

### 8. Naming Conventions

**RULE:** ALL names MUST be self-documenting and consistent

```typescript
// CORRECT
class TripDetectionService { }  // Services end with 'Service'
function useTripData() { }      // Hooks start with 'use'
function LoadingDialog() { }    // UI components are PascalCase
interface ConfigModel { }       // Interfaces/types describe the data

async function processTrip() { }  // Verbs for functions
const isUserLoggedIn: boolean;    // Boolean starts with is/has/can
const MAX_RETRY_COUNT = 3;        // Constants are UPPER_SNAKE_CASE

// WRONG
class TripDetection { }          // Ambiguous - service? component?
interface UserData { }           // Vague - what kind of data?
function trip() { }              // Not descriptive
let loggedIn: boolean;           // Should be isLoggedIn
const mrc = 3;                   // Cryptic abbreviation
```

### 9. File Organization

**RULE:** ALL files MUST follow strict organization

```
apps/
└── web/
    ├── app/              # Next.js App Router pages
    ├── components/       # App-specific components
    ├── lib/              # App utilities and services
    └── public/           # Static assets

packages/
├── ui/                   # Shared UI components
│   └── src/
│       └── components/
├── utils/                # Shared business logic
│   └── src/
│       ├── types/        # TypeScript types
│       ├── services/     # Business services
│       └── formatters/   # Data formatters
└── config/               # Shared configuration

supabase/
├── functions/            # Edge Functions
├── migrations/           # Database migrations
└── seed.sql              # Seed data

// File naming
trip.types.ts             # Types: name.types.ts
trip.service.ts           # Services: feature.service.ts
Dashboard.tsx             # Pages/Components: PascalCase.tsx
use-trips.ts              # Hooks: use-feature.ts
number.formatters.ts      # Utils: utility.purpose.ts
```

### 10. State Management

**RULE:** State updates MUST be predictable and traceable

```typescript
// CORRECT - Reactive state with TanStack Query
function useTripData(userId: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => TripService.getInstance().getUserTrips(userId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

// CORRECT - Local UI state
function TripList() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { data: trips, isLoading } = useTripData(userId);
  
  // Predictable state updates
  const selectTrip = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
  }, []);
}

// WRONG - Direct manipulation
trips.push(newTrip);  // NEVER modify state directly
setTrips([...trips, newTrip]); // WRONG for server state - use TanStack Query
```

### 11. Performance Standards

**RULE:** ALL code MUST be optimized for performance

```typescript
// CORRECT
// 1. Use React.memo for expensive components
export const TripCard = React.memo(({ trip }: { trip: Trip }) => {
  return <Card>{/* ... */}</Card>;
});

// 2. Clean up resources
useEffect(() => {
  const subscription = supabase
    .channel('trips')
    .on('postgres_changes', { event: '*' }, handleChange)
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// 3. Use virtualization for large lists
import { VirtualList } from '@tanstack/react-virtual';

<VirtualList
  count={trips.length}
  itemSize={80}
  renderItem={({ index }) => <TripItem trip={trips[index]} />}
/>

// WRONG
trips.map(trip => <TripCard key={trip.id} trip={trip} />); // Renders all at once
setInterval(...); // Without clearing
useEffect(() => { /* ... */ }); // Without cleanup
```

### 12. Documentation Requirements

**RULE:** ALL public APIs MUST be documented

```typescript
/**
 * Service for managing trip detection and recording.
 * 
 * This service handles:
 * - Automatic trip detection using device sensors
 * - Trip validation and storage
 * - Multi-modal trip splitting
 * 
 * @example
 * ```typescript
 * const service = TripDetectionService.getInstance();
 * await service.startDetection();
 * ```
 */
export class TripDetectionService {
  /**
   * Starts automatic trip detection.
   * 
   * @returns Promise<boolean> - true if detection started successfully
   * 
   * @throws {PermissionDeniedException} if location permission denied
   * @throws {ServiceUnavailableException} if sensors unavailable
   */
  async startDetection(): Promise<boolean> { }
}

// WRONG
class TripDetectionService {  // No documentation
  async startDetection() { } // No documentation
}
```

### 13. Security Requirements

**RULE:** ALL code MUST follow security best practices

```typescript
// CORRECT
// 1. NEVER expose sensitive data
console.log('Processing trip for user'); // No user ID in logs

// 2. Validate ALL inputs
import { z } from 'zod';

const distanceSchema = z.number().min(0).max(1000000);
const distance = distanceSchema.parse(userInput);

// 3. Use RLS policies (Supabase)
-- Trips table RLS policy
CREATE POLICY "Users can only read own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "No direct client writes" ON trips
  FOR INSERT WITH CHECK (false);

// WRONG
console.log(`User ${user.email} logged in`); // Exposes PII
const distance = Number(userInput); // No validation
-- Allow any authenticated writes (WRONG)
CREATE POLICY "Allow writes" ON trips
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 14. Git Commit Standards

**RULE:** ALL commits MUST follow conventional commits

```bash
# CORRECT
feat: Add gift card redemption service
fix: Correct points calculation for cycling trips
refactor: Extract trip validation to separate service
test: Add unit tests for offline sync
docs: Update API documentation for v2
chore: Update dependencies to latest versions

# Format: <type>: <description>
# Types: feat, fix, refactor, test, docs, chore, perf

# WRONG
"Updated code"         # Not descriptive
"FIXED THE BUG"       # No type prefix, all caps
"misc changes"        # Too vague
"wip"                # Never commit work in progress
```

### 15. Dependency Management

**RULE:** Dependencies MUST be justified and minimal

```json
// package.json
{
  "dependencies": {
    // APPROVED dependencies only
    "next": "^14.0.0",           // Framework
    "react": "^18.0.0",          // UI library
    "@supabase/supabase-js": "^2.0.0", // Database
    "@tanstack/react-query": "^5.0.0", // State management
    "zod": "^3.0.0"              // Validation
    // ... other approved deps
  }
}

// PROCESS for new dependencies:
// 1. Justify why existing code can't solve it
// 2. Check license compatibility
// 3. Verify maintenance status
// 4. Get team approval
// 5. Document usage in PRINCIPLES.md

// NEVER
"some-random-package": "^1.0.0"  // Without approval
```

## Code Review Checklist

**EVERY pull request MUST pass:**

- [ ] **L**everages existing patterns (ConfigService, EdgeFunctions, etc.)
- [ ] **E**xtends existing code rather than creating new
- [ ] **V**erifies state through reactive patterns (TanStack Query, Supabase realtime)
- [ ] **E**liminates all duplication
- [ ] **R**educes complexity (single responsibility, early returns)
- [ ] NO direct Supabase writes without proper service layer
- [ ] NO hardcoded configuration values
- [ ] Uses DataConverters for ALL type conversions
- [ ] Uses mandatory UI components (LoadingDialog, NumberFormatters)
- [ ] Includes proper error handling
- [ ] Creates audit logs for ALL value operations
- [ ] Has unit tests for new functionality
- [ ] Updates environment variables if adding config

## Pattern Registry Maintenance

**MANDATORY: When creating ANY new reusable component:**

1. **Update this document** - Add to "EXISTING PATTERNS TO LEVERAGE" section
2. **Create usage examples** - In the code documentation
3. **Add to relevant sections** - If it's a UI component, add to UI standards
4. **Notify team** - Comment in PR about new reusable pattern

**Example PR comment:**
```
New Reusable Pattern Added:
- Name: SettlementService
- Purpose: Handles all expense settlement operations
- Location: packages/utils/src/services/settlement.service.ts
- Usage: SettlementService.getInstance().calculateSettlements(expenses)
- Tests: packages/utils/src/services/settlement.service.test.ts
- Added to PRINCIPLES.md: Yes ✓
```

## RLS-Protected Data Access Pattern

**MANDATORY**: Use RLS-protected Supabase client for simple operations, Edge Functions for complex business logic.

**WHY**: 
- Security - RLS policies enforce access control at database level
- Performance - Direct database access for simple reads
- Consistency - Edge Functions for complex 
ness logic
- Auditability - All value operations through Edge Functions

**DO:**
```typescript
// Simple reads through RLS-protected client
function useTrips(userId: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    }
  });
}

// Complex operations through Edge Functions
async function settleExpenses(tripId: string) {
  const { data, error } = await supabase.functions.invoke('settle-expenses', {
    body: { tripId }
  });
  if (error) throw error;
  return data;
}
```

**DON'T:**
```typescript
// NEVER bypass RLS with service role on client
const supabase = createClient(url, serviceRoleKey); // WRONG

// NEVER do complex business logic on client
const settlements = calculateOptimalSettlements(expenses); // WRONG - use Edge Function
await supabase.from('settlements').insert(settlements); // WRONG - complex operation
```

## Component State Persistence Pattern

**USE WHEN**: Building tabbed interfaces where component state should persist when switching tabs.

**WHY**: Prevents data loss, maintains scroll position, preserves form data, keeps queries cached.

**DO:**
```typescript
// Use TanStack Query's staleTime to keep data cached
function usePersistentTrips(userId: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => fetchTrips(userId),
    staleTime: 10 * 60 * 1000, // Keep data fresh for 10 minutes
    gcTime: 30 * 60 * 1000,    // Keep in cache for 30 minutes
  });
}

// Use React state preservation in layout
// app/trip/[id]/layout.tsx
export default function TripLayout({ children }: { children: React.ReactNode }) {
  // State persists across tab changes within this layout
  const [selectedTab, setSelectedTab] = useState('itinerary');
  
  return (
    <div>
      <TabNavigation selected={selectedTab} onChange={setSelectedTab} />
      {children}
    </div>
  );
}
```

## Real-time Updates Pattern

**USE WHEN**: Need real-time updates for collaborative features.

**WHY**: Supabase provides built-in real-time subscriptions for live updates.

**DO:**
```typescript
// Use Supabase real-time for live updates
function useRealtimeTrips(tripId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          // Invalidate and refetch the query
          queryClient.invalidateQueries(['trip', tripId]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);
}

// Use TanStack Query polling as fallback
function usePollingTrips(userId: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => fetchTrips(userId),
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
  });
}
```

## Living Document

This document MUST be updated when:
- New reusable patterns are created
- Existing patterns are deprecated
- Better patterns emerge
- Common mistakes are identified

**Process:**
1. Create the reusable code
2. Update PRINCIPLES.md in the SAME PR
3. Reviewer MUST verify both code AND documentation

## Enforcement

**Violations of these principles will result in:**
1. Immediate PR rejection
2. Required refactoring before merge
3. Addition to technical debt log

**Special violation: Creating non-reusable code when reusable was possible:**
- Requires complete rewrite
- Must document why existing patterns didn't work
- Must create reusable version

**NO EXCEPTIONS. NO NEGOTIATIONS.**

## Automated Enforcement

This project enforces these principles through:

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged
npx husky install

# Add validation scripts
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-commit "npm run type-check"
```

### What Gets Validated
- **TypeScript**: Type checking with strict mode
- **ESLint**: Code quality and patterns
- **Prettier**: Code formatting
- **Tests**: Required test coverage

### Automatic Exclusions
Auto-generated files are ignored:
- `.next/*` - Next.js build output
- `*.generated.ts` - Generated TypeScript files
- `node_modules/*` - Dependencies
- `coverage/*` - Test coverage reports

### Benefits
- Immediate feedback on violations
- Consistent code quality
- Automated formatting
- Enforced test coverage

### Manual Validation Commands
```bash
# Run all validations
pnpm lint
pnpm type-check
pnpm test

# Fix auto-fixable issues
pnpm lint:fix
pnpm format
```