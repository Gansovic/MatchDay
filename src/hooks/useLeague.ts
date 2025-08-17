/**
 * League Management Hooks for MatchDay
 * 
 * Custom hooks for league-related operations like fetching leagues,
 * searching, and managing league data
 */

'use client';

import { useApi } from './useApi';
import { useDebounce } from './useDebounce';
import { LeagueService } from '@/lib/services/league.service';
import { supabase } from '@/lib/supabase/client';
import { useState, useMemo } from 'react';

// Hook for fetching all leagues
export function useLeagues() {
  const leagueService = LeagueService.getInstance(supabase);
  
  return useApi(
    async () => {
      const result = await leagueService.getLeagues();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch leagues');
      }
      return result.data || [];
    },
    [],
    {
      immediate: true,
      cacheKey: 'all-leagues',
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  );
}

// Hook for fetching a single league
export function useLeague(leagueId: string | null) {
  const leagueService = LeagueService.getInstance(supabase);
  
  return useApi(
    async () => {
      if (!leagueId) return null;
      const result = await leagueService.getLeagueById(leagueId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch league');
      }
      return result.data;
    },
    [leagueId],
    {
      immediate: !!leagueId,
      cacheKey: leagueId ? `league-${leagueId}` : undefined,
      cacheTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

// Hook for searching leagues with debouncing
export function useLeagueSearch(searchTerm: string = '', filters: {
  sport_type?: string;
  league_type?: string;
  location?: string;
} = {}) {
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const leagueService = LeagueService.getInstance(supabase);

  const { data: allLeagues } = useLeagues();

  const filteredLeagues = useMemo(() => {
    if (!allLeagues) return [];

    let filtered = allLeagues;

    // Text search
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(league => 
        league.name.toLowerCase().includes(term) ||
        league.description?.toLowerCase().includes(term) ||
        league.location?.toLowerCase().includes(term)
      );
    }

    // Sport type filter
    if (filters.sport_type) {
      filtered = filtered.filter(league => league.sport_type === filters.sport_type);
    }

    // League type filter
    if (filters.league_type) {
      filtered = filtered.filter(league => league.league_type === filters.league_type);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(league => 
        league.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    return filtered;
  }, [allLeagues, debouncedSearchTerm, filters]);

  return {
    leagues: filteredLeagues,
    loading: !allLeagues,
    isSearching: searchTerm !== debouncedSearchTerm,
    searchTerm: debouncedSearchTerm
  };
}

// Hook for getting leagues by sport type
export function useLeaguesBySport(sportType: string | null) {
  const { data: allLeagues, loading, error } = useLeagues();

  const leaguesBySport = useMemo(() => {
    if (!allLeagues || !sportType) return [];
    return allLeagues.filter(league => league.sport_type === sportType);
  }, [allLeagues, sportType]);

  return {
    data: leaguesBySport,
    loading,
    error
  };
}

// Hook for getting popular leagues (most teams)
export function usePopularLeagues(limit: number = 5) {
  const { data: allLeagues, loading, error } = useLeagues();

  const popularLeagues = useMemo(() => {
    if (!allLeagues) return [];
    
    // Sort by team count (assuming we have this data)
    return allLeagues
      .slice() // Create a copy to avoid mutating original array
      .sort((a, b) => (b.team_count || 0) - (a.team_count || 0))
      .slice(0, limit);
  }, [allLeagues, limit]);

  return {
    data: popularLeagues,
    loading,
    error
  };
}