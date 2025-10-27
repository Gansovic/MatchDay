'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Calendar, Settings, Clock, Image, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import SchedulingConfigPanel, { SchedulingConfig } from '@/components/SchedulingConfigPanel';
import FixtureGenerationPanel from '@/components/FixtureGenerationPanel';
import FixturePreviewModal from '@/components/FixturePreviewModal';
import MatchResultsModal from '@/components/MatchResultsModal';
import { SeasonMediaTab } from '@/components/media/season-media-tab';
import { AdminStatsCard } from '@/components/dashboard/AdminStatsCard';
import { StatusBadge } from '@matchday/ui';

export default function AdminSeasonDashboard() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [seasonData, setSeasonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fixturesCount, setFixturesCount] = useState(0);
  const [fixturesData, setFixturesData] = useState<any>(null);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [schedulingConfig, setSchedulingConfig] = useState<SchedulingConfig | undefined>();
  const [isLeagueOwner, setIsLeagueOwner] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'standings' | 'teams' | 'media'>('overview');
  const [recalculatingStats, setRecalculatingStats] = useState(false);
  const [statsRecalcResult, setStatsRecalcResult] = useState<any>(null);

  const loadSeasonData = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/seasons`);
      if (response.ok) {
        const result = await response.json();
        const season = result.data?.find((s: any) => s.id === seasonId);
        setSeasonData(season);
      }
    } catch (err) {
      console.error('Failed to load season data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFixturesData = async () => {
    try {
      setLoadingFixtures(true);
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not logged in');
        return;
      }

      const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setFixturesCount(result.data?.totalMatches || 0);
        setFixturesData(result.data);
      }
    } catch (err) {
      console.error('Failed to load fixtures:', err);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const checkLeagueOwnership = async () => {
    try {
      setCheckingPermissions(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      if (!user) {
        console.log('❌ No user logged in');
        setIsLeagueOwner(false);
        return;
      }

      // Fetch league data with created_by field
      const { data: league, error } = await supabase
        .from('leagues')
        .select('created_by')
        .eq('id', leagueId)
        .single();

      console.log('🏆 League data:', { leagueId, created_by: league?.created_by, error });

      if (error) {
        console.error('Failed to check league ownership:', error);
        setIsLeagueOwner(false);
        return;
      }

      // Check if current user is the league owner
      const isOwner = league?.created_by === user.id;
      console.log('🔐 Ownership check:', {
        userId: user.id,
        createdBy: league?.created_by,
        isOwner,
        match: league?.created_by === user.id
      });
      setIsLeagueOwner(isOwner);
    } catch (err) {
      console.error('Error checking league ownership:', err);
      setIsLeagueOwner(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  useEffect(() => {
    loadSeasonData();
    loadFixturesData();
    checkLeagueOwnership();
  }, [leagueId, seasonId]);

  // Auto-switch to fixtures tab when fixtures are loaded
  useEffect(() => {
    if (fixturesCount > 0 && activeTab === 'overview') {
      setActiveTab('fixtures');
    }
  }, [fixturesCount]);

  const handleFixturesGenerated = () => {
    loadFixturesData();
    // Switch to fixtures tab after generation
    setActiveTab('fixtures');
  };

  const handlePreview = (data: any) => {
    setPreviewData(data);
    setShowPreviewModal(true);
  };

  const handleEnterResults = (matchId: string) => {
    console.log('📊 Enter Results clicked', { matchId, isLeagueOwner });
    setSelectedMatchId(matchId);
    setShowResultsModal(true);
  };

  const handleResultsSaved = () => {
    loadFixturesData();
  };

  const handleRecalculateStats = async () => {
    if (!confirm('Recalculate all player and team statistics for this season from match events? This will overwrite existing stats.')) {
      return;
    }

    try {
      setRecalculatingStats(true);
      setStatsRecalcResult(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      console.log('🔄 Recalculating stats for season:', seasonId);

      const response = await fetch(`/api/seasons/${seasonId}/recalculate-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to recalculate stats');
      }

      console.log('✅ Stats recalculated:', result.data);
      setStatsRecalcResult(result.data);

      // Show success message
      alert(`✅ Statistics recalculated successfully!\n\n` +
        `Matches processed: ${result.data.stats.matches_processed}\n` +
        `Players updated: ${result.data.stats.players_updated}\n` +
        `Teams updated: ${result.data.stats.teams_updated}`
      );

    } catch (error) {
      console.error('Failed to recalculate stats:', error);
      alert('❌ Failed to recalculate statistics: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRecalculatingStats(false);
    }
  };

  // Determine which tabs to show based on fixtures
  const getAvailableTabs = () => {
    if (fixturesCount === 0) {
      return ['overview', 'teams', 'media'];
    }
    return ['overview', 'fixtures', 'teams', 'media'];
  };

  // Tab configuration
  const tabConfig = {
    overview: { icon: Settings, label: 'Overview' },
    fixtures: { icon: Calendar, label: 'Fixtures' },
    standings: { icon: Trophy, label: 'Standings' },
    teams: { icon: Users, label: 'Teams' },
    media: { icon: Image, label: 'Media' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!seasonData) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to League
          </button>
          <div className="text-center text-gray-400">Season not found</div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalMatches = fixturesData?.totalMatches || 0;
  const totalMatchdays = fixturesData?.totalMatchdays || 0;
  const registeredTeams = seasonData.registered_teams_count || 0;
  const maxTeams = seasonData.max_teams || 0;

  // Calculate season progress
  const startDate = new Date(seasonData.start_date);
  const endDate = new Date(seasonData.end_date);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-2 text-sm animate-fade-in">
          <button
            onClick={() => router.push('/leagues')}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            Leagues
          </button>
          <span className="text-gray-600">/</span>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            League
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Season Dashboard</span>
        </div>

        {/* Gradient Hero Header */}
        <div className="admin-gradient rounded-2xl p-8 text-white mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">
                  {seasonData.display_name || seasonData.name}
                </h1>
                <StatusBadge
                  status={seasonData.status.charAt(0).toUpperCase() + seasonData.status.slice(1)}
                  variant={
                    seasonData.status === 'active' ? 'success' :
                    seasonData.status === 'draft' ? 'warning' :
                    seasonData.status === 'registration' ? 'info' :
                    'default'
                  }
                />
              </div>
              <p className="text-white/90 text-lg mb-4">{seasonData.season_year}</p>
              <div className="flex flex-wrap gap-6 text-white/90">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {registeredTeams} Team{registeredTeams !== 1 ? 's' : ''}
                  {maxTeams > 0 && ` / ${maxTeams}`}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {totalMatches} Match{totalMatches !== 1 ? 'es' : ''}
                </span>
                <span className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {seasonData.tournament_format}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-5xl font-bold mb-2">{daysRemaining}</div>
              <div className="text-white/90">Days Remaining</div>
              {progressPercent > 0 && (
                <div className="mt-3 bg-white/20 rounded-full h-2 w-32 ml-auto overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {getAvailableTabs().map((tab) => {
                const TabIcon = tabConfig[tab]?.icon;
                const label = tabConfig[tab]?.label || tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                      activeTab === tab
                        ? 'border-orange-500 text-orange-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {TabIcon && <TabIcon className="w-4 h-4" />}
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Teams Registration Progress */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Registered Teams</p>
                <p className="text-3xl font-bold text-blue-400">
                  {registeredTeams}
                  {maxTeams > 0 && <span className="text-lg text-gray-500"> / {maxTeams}</span>}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            {maxTeams > 0 && (
              <div className="mt-2">
                <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (registeredTeams / maxTeams) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.min(100, Math.round((registeredTeams / maxTeams) * 100))}% capacity
                </p>
              </div>
            )}
          </div>

          {/* Total Fixtures */}
          <AdminStatsCard
            label="Total Matches"
            value={totalMatches}
            icon={Calendar}
            iconColor="text-green-500"
            valueColor="text-green-400"
            change={totalMatchdays > 0 ? `${totalMatchdays} matchdays` : undefined}
          />

          {/* Season Progress */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Season Progress</p>
                <p className="text-3xl font-bold text-orange-400">{Math.round(progressPercent)}%</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="admin-gradient h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {elapsedDays} of {totalDays} days elapsed
              </p>
            </div>
          </div>

          {/* Tournament Format */}
          <AdminStatsCard
            label="Tournament Format"
            value={seasonData.tournament_format}
            icon={Settings}
            iconColor="text-purple-500"
            valueColor="text-white"
          />
        </div>

        {/* Stats Management */}
        {fixturesCount > 0 && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-gray-700 rounded-lg p-6 mb-8 card-hover animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-white">Statistics Management</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Player and team statistics are automatically calculated from match events when matches are completed.
                  Use the button below to manually recalculate all statistics for this season.
                </p>
                {statsRecalcResult && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
                    <p className="text-green-300 text-sm">
                      ✅ Last recalculation: {statsRecalcResult.stats.matches_processed} matches,{' '}
                      {statsRecalcResult.stats.players_updated} players,{' '}
                      {statsRecalcResult.stats.teams_updated} teams updated
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleRecalculateStats}
                disabled={recalculatingStats || !isLeagueOwner}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  flex items-center gap-2 font-medium whitespace-nowrap"
              >
                <RefreshCw className={`w-5 h-5 ${recalculatingStats ? 'animate-spin' : ''}`} />
                {recalculatingStats ? 'Recalculating...' : 'Recalculate Stats'}
              </button>
            </div>
          </div>
        )}

        {/* Scheduling & Fixture Management */}
        {fixturesCount === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Scheduling Configuration */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 card-hover animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-white">Scheduling Configuration</h2>
              </div>
              <SchedulingConfigPanel
                seasonId={seasonId}
                leagueId={leagueId}
                disabled={seasonData.status === 'active' || seasonData.status === 'completed'}
                onConfigChange={setSchedulingConfig}
              />
            </div>

            {/* Fixture Generation */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 card-hover animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-white">Fixture Management</h2>
              </div>
              <FixtureGenerationPanel
                seasonId={seasonId}
                leagueId={leagueId}
                hasExistingFixtures={fixturesCount > 0}
                fixturesCount={fixturesCount}
                onFixturesGenerated={handleFixturesGenerated}
                onPreview={handlePreview}
                schedulingConfig={schedulingConfig}
              />
            </div>
          </div>
        )}
          </>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && fixturesCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Season Fixtures</h2>
                  <p className="text-sm text-gray-400">
                    {fixturesData?.totalMatches || 0} matches across {fixturesData?.totalMatchdays || 0} matchdays
                  </p>
                </div>
              </div>
            </div>

            {loadingFixtures ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-900 border border-gray-700 rounded-xl"></div>
                <div className="h-32 bg-gray-900 border border-gray-700 rounded-xl"></div>
              </div>
            ) : fixturesData?.fixturesByMatchday ? (
              <div className="space-y-4">
                {Object.keys(fixturesData.fixturesByMatchday)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map(matchdayNum => {
                    const matchdayFixtures = fixturesData.fixturesByMatchday[matchdayNum];
                    const matchDate = matchdayFixtures[0]?.match_date;

                    return (
                      <div key={matchdayNum} className="bg-gray-900 border border-gray-700 rounded-xl p-6 card-hover animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-500/20 px-4 py-2 rounded-lg">
                              <span className="text-2xl font-bold text-orange-400">MD {matchdayNum}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Matchday {matchdayNum}
                              </h3>
                              {matchDate && (
                                <p className="text-sm text-gray-400">
                                  {new Date(matchDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {matchdayFixtures.length} match{matchdayFixtures.length !== 1 ? 'es' : ''}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {matchdayFixtures.map((fixture: any, idx: number) => (
                            <div
                              key={fixture.id || idx}
                              onClick={() => {
                                console.log('🎯 Fixture clicked', { isLeagueOwner, fixtureId: fixture.id });
                                if (isLeagueOwner && fixture.id) {
                                  handleEnterResults(fixture.id);
                                } else {
                                  console.log('❌ Click blocked:', { isLeagueOwner, fixtureId: fixture.id });
                                }
                              }}
                              className={`bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 hover:bg-gray-800/80 transition-all duration-200 ${isLeagueOwner && fixture.id ? 'cursor-pointer' : ''}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                {/* Court Badge */}
                                {fixture.court_number && (
                                  <div className="flex-shrink-0">
                                    <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-3 py-1.5">
                                      <span className="text-sm font-semibold text-purple-300">
                                        Court {fixture.court_number}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Teams */}
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Home Team */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
                                      style={{
                                        backgroundColor: fixture.home_team?.team_color || '#374151'
                                      }}
                                    >
                                      <span className="text-white text-base font-bold">
                                        {fixture.home_team?.name?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                    <span className="text-white font-semibold truncate">
                                      {fixture.home_team?.name || 'Home Team'}
                                    </span>
                                  </div>

                                  {/* VS Badge or Score */}
                                  <div className="flex-shrink-0">
                                    {fixture.home_score !== undefined && fixture.home_score !== null && fixture.away_score !== undefined && fixture.away_score !== null ? (
                                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-1">
                                        <span className="text-green-300 text-sm font-bold">
                                          {fixture.home_score} - {fixture.away_score}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-700 rounded-lg px-3 py-1">
                                        <span className="text-gray-300 text-sm font-bold">VS</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Away Team */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                    <span className="text-white font-semibold truncate text-right">
                                      {fixture.away_team?.name || 'Away Team'}
                                    </span>
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
                                      style={{
                                        backgroundColor: fixture.away_team?.team_color || '#374151'
                                      }}
                                    >
                                      <span className="text-white text-base font-bold">
                                        {fixture.away_team?.name?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Time Badge */}
                                {fixture.match_time && (
                                  <div className="flex-shrink-0">
                                    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-orange-400" />
                                      <span className="text-sm font-semibold text-orange-300">
                                        {(() => {
                                          const [hours, minutes] = fixture.match_time.split(':');
                                          const hour = parseInt(hours);
                                          const ampm = hour >= 12 ? 'PM' : 'AM';
                                          const displayHour = hour % 12 || 12;
                                          return `${displayHour}:${minutes} ${ampm}`;
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No fixtures data available
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Registered Teams</h2>
                <p className="text-sm text-gray-400">
                  {seasonData.teams?.length || 0} team{seasonData.teams?.length !== 1 ? 's' : ''} registered
                </p>
              </div>
            </div>
          </div>

          {seasonData.teams && seasonData.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seasonData.teams.map((teamReg: any) => (
                <div
                  key={teamReg.team_id}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-5 card-hover animate-fade-in group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: teamReg.team?.team_color || '#374151' }}
                      >
                        <span className="text-white font-bold text-xl">
                          {teamReg.team?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">{teamReg.team?.name || 'Unknown Team'}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(teamReg.registration_date || teamReg.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={teamReg.status}
                      variant={
                        teamReg.status === 'registered' || teamReg.status === 'confirmed' ? 'success' : 'default'
                      }
                      size="sm"
                    />
                  </div>

                  {/* Additional team info if available */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 pt-3 border-t border-gray-800">
                    <span>ID: {teamReg.team_id.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Teams Registered</h3>
              <p className="text-gray-400">Teams will appear here once they register for this season</p>
            </div>
          )}
        </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Image className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Season Media</h2>
                <p className="text-sm text-gray-400">Photos and videos from this season</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 card-hover animate-fade-in">
            <SeasonMediaTab
              seasonId={seasonId}
              seasonName={seasonData?.display_name || seasonData?.name || 'Season'}
              canUpload={isLeagueOwner}
            />
            {!checkingPermissions && !isLeagueOwner && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-300 mb-1">Upload Restricted</h4>
                  <p className="text-sm text-yellow-200/80">
                    Only the league owner can upload season media.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Fixture Preview Modal */}
      <FixturePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        previewData={previewData}
        seasonId={seasonId}
        schedulingConfig={schedulingConfig}
        onFixturesGenerated={handleFixturesGenerated}
      />

      {/* Match Results Modal */}
      {selectedMatchId && (
        <MatchResultsModal
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedMatchId(null);
          }}
          matchId={selectedMatchId}
          onSaved={handleResultsSaved}
        />
      )}
    </div>
  );
}
