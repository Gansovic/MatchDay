/**
 * Public League Exploration Page
 * 
 * Copa Facil-style public league browsing with filtering and search.
 * Allows teams to discover and join published leagues.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  Star,
  Zap,
  Users,
  Trophy
} from 'lucide-react';
import { LeagueDiscovery } from '@/components/player/league-discovery';
import { FeaturedLeagues } from '@/components/leagues/featured-leagues';
import { LeagueDiscovery as LeagueDiscoveryType, SportType, LeagueType } from '@matchday/database';

interface FilterState {
  search: string;
  sportType: SportType | '';
  leagueType: LeagueType | '';
  location: string;
  maxEntryFee: string;
  featured: boolean;
  openRegistration: boolean;
}

export default function ExploreLeaguesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    sportType: (searchParams.get('sport_type') as SportType) || '',
    leagueType: (searchParams.get('league_type') as LeagueType) || '',
    location: searchParams.get('location') || '',
    maxEntryFee: searchParams.get('max_entry_fee') || '',
    featured: searchParams.get('featured') === 'true',
    openRegistration: searchParams.get('open_registration') === 'true'
  });

  const [leagues, setLeagues] = useState<LeagueDiscoveryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch leagues based on filters
  const fetchLeagues = async (currentFilters: FilterState) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (currentFilters.search) queryParams.set('search', currentFilters.search);
      if (currentFilters.sportType) queryParams.set('sport_type', currentFilters.sportType);
      if (currentFilters.leagueType) queryParams.set('league_type', currentFilters.leagueType);
      if (currentFilters.location) queryParams.set('location', currentFilters.location);
      if (currentFilters.maxEntryFee) queryParams.set('max_entry_fee', currentFilters.maxEntryFee);
      if (currentFilters.featured) queryParams.set('featured', 'true');
      if (currentFilters.openRegistration) queryParams.set('open_registration', 'true');
      
      const response = await fetch(`/api/leagues?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }
      
      const result = await response.json();
      setLeagues(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeagues(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sportType: '',
      leagueType: '',
      location: '',
      maxEntryFee: '',
      featured: false,
      openRegistration: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Leagues
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and join leagues that match your team's skill level, location, and schedule preferences.
          </p>
        </div>

        {/* Featured Section */}
        {!filters.search && !filters.sportType && !filters.leagueType && (
          <div className="mb-12">
            <FeaturedLeagues limit={3} showViewAll={false} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leagues by name or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-4"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sport Type
                </label>
                <select
                  value={filters.sportType}
                  onChange={(e) => handleFilterChange('sportType', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sports</option>
                  <option value="soccer">Soccer</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="tennis">Tennis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  League Type
                </label>
                <select
                  value={filters.leagueType}
                  onChange={(e) => handleFilterChange('leagueType', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="recreational">Recreational</option>
                  <option value="competitive">Competitive</option>
                  <option value="semi-pro">Semi-Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City or region"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Entry Fee
                </label>
                <input
                  type="number"
                  placeholder="Max fee"
                  value={filters.maxEntryFee}
                  onChange={(e) => handleFilterChange('maxEntryFee', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleFilterChange('featured', !filters.featured)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.featured
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              } border dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Featured Only
            </button>
            
            <button
              onClick={() => handleFilterChange('openRegistration', !filters.openRegistration)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.openRegistration
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              } border dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Open Registration
            </button>
            
            {Object.values(filters).some(v => v !== '' && v !== false) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading leagues...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">Failed to load leagues</div>
              <div className="text-gray-500 text-sm">{error}</div>
            </div>
          ) : leagues.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {leagues.length} League{leagues.length !== 1 ? 's' : ''} Found
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {leagues.map((league) => (
                  <div key={league.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {league.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {league.description}
                          </p>
                        </div>
                        {league.featured && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
                            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                            {league.sport_type}
                          </div>
                          <div className="text-xs text-gray-500">Sport</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                            {league.league_type}
                          </div>
                          <div className="text-xs text-gray-500">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {league.teamCount}/{league.max_teams || '∞'}
                          </div>
                          <div className="text-xs text-gray-500">Teams</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {league.entry_fee ? `$${league.entry_fee}` : 'Free'}
                          </div>
                          <div className="text-xs text-gray-500">Entry</div>
                        </div>
                      </div>

                      {(league.location || league.registration_deadline) && (
                        <div className="space-y-2 mb-4">
                          {league.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <MapPin className="w-4 h-4" />
                              <span>{league.location}</span>
                            </div>
                          )}
                          {league.registration_deadline && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <Calendar className="w-4 h-4" />
                              <span>Registration closes {new Date(league.registration_deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap mb-4">
                        {league.auto_approve_teams && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Instant Join
                          </span>
                        )}
                        {league.availableSpots > 0 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {league.availableSpots} Spots Available
                          </span>
                        )}
                      </div>

                      <button
                        disabled={league.availableSpots === 0}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          league.auto_approve_teams
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } ${league.availableSpots === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
                      >
                        {league.availableSpots === 0 ? 'League Full' : 
                         league.auto_approve_teams ? 'Join Instantly ⚡' : 'Request to Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No leagues found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try adjusting your filters to find more leagues.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}