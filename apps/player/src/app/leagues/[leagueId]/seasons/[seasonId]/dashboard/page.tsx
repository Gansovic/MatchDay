/**
 * Player Season Dashboard
 *
 * Player-focused view of season information:
 * - Draft/Registration: Join season, view registered teams
 * - Active: View fixtures, standings, upcoming matches
 * - Completed: View final standings, all results
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Calendar,
  Trophy,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import SeasonDashboardLayout from '@/components/leagues/dashboards/SeasonDashboardLayout';
import { TeamJoinRequestModal } from '@/components/seasons/TeamJoinRequestModal';
import FixturesCalendar from '@/components/seasons/FixturesCalendar';
import StandingsTable from '@/components/seasons/StandingsTable';
import { supabase } from '@/lib/supabase/client';

interface TeamRegistration {
  id: string;
  name: string;
  team_color?: string;
  members: number;
  status: 'approved' | 'pending' | 'rejected';
  registrationDate: string;
}

export default function PlayerSeasonDashboard() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'standings' | 'teams'>('overview');
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [userHasTeamInSeason, setUserHasTeamInSeason] = useState(false);
  const [userTeamIds, setUserTeamIds] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(false);

  // Check if user has a team in this season
  useEffect(() => {
    const checkUserTeamInSeason = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserHasTeamInSeason(false);
          return;
        }

        const { data: userTeams, error: teamsError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (teamsError) throw teamsError;

        if (!userTeams || userTeams.length === 0) {
          setUserHasTeamInSeason(false);
          return;
        }

        const teamIds = userTeams.map(tm => tm.team_id);
        setUserTeamIds(teamIds);

        const { data: seasonTeams, error: seasonTeamsError } = await supabase
          .from('season_teams')
          .select('team_id')
          .eq('season_id', seasonId)
          .in('team_id', teamIds);

        if (seasonTeamsError) throw seasonTeamsError;

        setUserHasTeamInSeason(seasonTeams && seasonTeams.length > 0);
      } catch (err) {
        console.error('Failed to check user team in season:', err);
        setUserHasTeamInSeason(false);
      }
    };

    checkUserTeamInSeason();
  }, [seasonId]);

  // Load season data
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`);

        if (response.ok) {
          const result = await response.json();
          const season = result.data?.find((s: any) => s.id === seasonId);

          if (season) {
            setSeasonData(season);

            // Transform teams data
            const teams: TeamRegistration[] = (season.teams || []).map((teamReg: any) => ({
              id: teamReg.team_id,
              name: teamReg.team?.name || 'Unknown Team',
              team_color: teamReg.team?.team_color,
              members: teamReg.team?.currentPlayers?.[0]?.count || 0,
              status: teamReg.status === 'registered' || teamReg.status === 'confirmed' ? 'approved' : 'pending',
              registrationDate: teamReg.registration_date || teamReg.created_at
            }));

            setTeamRegistrations(teams);
          }
        }
      } catch (err) {
        console.error('Failed to load season data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSeasonData();
  }, [leagueId, seasonId]);

  // Load fixtures for active/completed seasons
  useEffect(() => {
    if (!seasonData || seasonData.status === 'draft' || seasonData.status === 'registration') {
      return;
    }

    const loadFixtures = async () => {
      try {
        setLoadingFixtures(true);
        const response = await fetch(`/api/seasons/${seasonId}/fixtures`);

        if (response.ok) {
          const result = await response.json();
          setMatches(result.data || []);
        }
      } catch (err) {
        console.error('Failed to load fixtures:', err);
      } finally {
        setLoadingFixtures(false);
      }
    };

    loadFixtures();
  }, [seasonId, seasonData]);

  // Load standings for active/completed seasons
  useEffect(() => {
    if (!seasonData || seasonData.status === 'draft' || seasonData.status === 'registration') {
      return;
    }

    const loadStandings = async () => {
      try {
        setLoadingStandings(true);
        const response = await fetch(`/api/seasons/${seasonId}/standings`);

        if (response.ok) {
          const result = await response.json();
          setStandings(result.data || []);
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLoadingStandings(false);
      }
    };

    loadStandings();
  }, [seasonId, seasonData]);

  const handleJoinRequestSubmitted = useCallback(async () => {
    setShowJoinModal(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!userTeams || userTeams.length === 0) return;

      const teamIds = userTeams.map(tm => tm.team_id);

      const { data: seasonTeams } = await supabase
        .from('season_teams')
        .select('team_id')
        .eq('season_id', seasonId)
        .in('team_id', teamIds);

      setUserHasTeamInSeason(seasonTeams && seasonTeams.length > 0);
    } catch (err) {
      console.error('Failed to re-check user team in season:', err);
    }
  }, [seasonId]);

  const getDaysUntilDeadline = () => {
    if (!seasonData?.registration_deadline) return 0;
    const deadline = new Date(seasonData.registration_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRegistrationProgress = () => {
    if (!seasonData) return 0;
    const current = teamRegistrations.filter(t => t.status === 'approved').length;
    const min = seasonData.min_teams || 0;
    return min > 0 ? Math.min((current / min) * 100, 100) : 0;
  };

  const getUpcomingMatches = () => {
    const now = new Date();
    return matches
      .filter(m => m.status === 'scheduled' && new Date(m.match_date) >= now)
      .slice(0, 5);
  };

  const getRecentResults = () => {
    return matches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
      .slice(0, 5);
  };

  // Determine available tabs based on season status
  const getAvailableTabs = () => {
    if (!seasonData) return ['overview'];

    if (seasonData.status === 'draft' || seasonData.status === 'registration') {
      return ['overview', 'teams'];
    }

    return ['overview', 'fixtures', 'standings', 'teams'];
  };

  if (loading) {
    return (
      <SeasonDashboardLayout
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        availableTabs={getAvailableTabs()}
        title={seasonData?.display_name || 'Season Dashboard'}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading season data...</span>
        </div>
      </SeasonDashboardLayout>
    );
  }

  const renderOverview = () => {
    // For draft/registration seasons
    if (seasonData.status === 'draft' || seasonData.status === 'registration') {
      return (
        <div className="space-y-6">
          {/* Registration Status */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Team Registration Open
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {getDaysUntilDeadline() > 0
                      ? `${getDaysUntilDeadline()} days remaining until deadline`
                      : 'Registration deadline approaching'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {teamRegistrations.filter(t => t.status === 'approved').length} / {seasonData.max_teams}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Teams Registered</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-1">
                <span>Registration Progress</span>
                <span>{getRegistrationProgress().toFixed(0)}% to minimum</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(getRegistrationProgress(), 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-sm text-blue-800 dark:text-blue-200">
              {teamRegistrations.filter(t => t.status === 'approved').length >= (seasonData.min_teams || 0)
                ? '✅ Minimum teams registered - season can proceed'
                : `⏳ Need ${(seasonData.min_teams || 0) - teamRegistrations.filter(t => t.status === 'approved').length} more teams to start season`
              }
            </div>
          </div>

          {/* Join Season Section */}
          {!userHasTeamInSeason && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Join This Season
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Request to register your team for this season
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Request to Join
                </button>
              </div>
            </div>
          )}

          {userHasTeamInSeason && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Already Registered
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your team is registered for this season
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Season Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Season Start</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(seasonData.start_date).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Max Teams</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {seasonData.max_teams}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Match Day</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {seasonData.match_day || 'TBD'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For active/completed seasons
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`rounded-xl border p-6 ${
          seasonData.status === 'active'
            ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
            : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className={`w-6 h-6 ${
                seasonData.status === 'active' ? 'text-green-600' : 'text-gray-600'
              }`} />
              <div>
                <h3 className={`font-semibold ${
                  seasonData.status === 'active' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  Season {seasonData.status === 'active' ? 'In Progress' : 'Completed'}
                </h3>
                <p className={`text-sm ${
                  seasonData.status === 'active' ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {teamRegistrations.filter(t => t.status === 'approved').length} teams competing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Matches */}
        {seasonData.status === 'active' && getUpcomingMatches().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Matches
            </h3>
            <FixturesCalendar
              matches={getUpcomingMatches()}
              userTeamIds={userTeamIds}
              showOnlyUpcoming={true}
            />
          </div>
        )}

        {/* Recent Results */}
        {getRecentResults().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Results
            </h3>
            <FixturesCalendar
              matches={getRecentResults()}
              userTeamIds={userTeamIds}
            />
          </div>
        )}

        {/* Top 3 Standings Preview */}
        {standings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Teams
              </h3>
              <button
                onClick={() => setActiveTab('standings')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Full Table →
              </button>
            </div>
            <StandingsTable standings={standings.slice(0, 3)} highlightTeamIds={userTeamIds} />
          </div>
        )}
      </div>
    );
  };

  const renderFixtures = () => {
    if (loadingFixtures) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading fixtures...</span>
        </div>
      );
    }

    return (
      <FixturesCalendar
        matches={matches}
        userTeamIds={userTeamIds}
      />
    );
  };

  const renderStandings = () => {
    if (loadingStandings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading standings...</span>
        </div>
      );
    }

    return (
      <StandingsTable
        standings={standings}
        highlightTeamIds={userTeamIds}
      />
    );
  };

  const renderTeams = () => {
    const approvedTeams = teamRegistrations.filter(t => t.status === 'approved');

    if (approvedTeams.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Teams Registered
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Teams will appear here once they are registered for the season
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Registered Teams ({approvedTeams.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedTeams.map((team) => {
            const isUserTeam = userTeamIds.includes(team.id);

            return (
              <div
                key={team.id}
                className={`border rounded-lg p-4 ${
                  isUserTeam
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: team.team_color || '#374151' }}
                  >
                    <span className="text-white text-lg font-bold">
                      {team.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                    </h4>
                    {isUserTeam && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Your Team
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {team.members || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered:</span>
                    <span>{new Date(team.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'fixtures':
        return renderFixtures();
      case 'standings':
        return renderStandings();
      case 'teams':
        return renderTeams();
      default:
        return null;
    }
  };

  return (
    <>
      <SeasonDashboardLayout
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        availableTabs={getAvailableTabs()}
        title={seasonData?.display_name || seasonData?.name || 'Season Dashboard'}
      >
        {renderContent()}
      </SeasonDashboardLayout>

      <TeamJoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        seasonId={seasonId}
        seasonName={seasonData?.name || 'Current Season'}
        leagueId={leagueId}
        onRequestSubmitted={handleJoinRequestSubmitted}
      />
    </>
  );
}
