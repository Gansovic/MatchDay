/**
 * Draft Season Dashboard
 * 
 * Shows preparation data for upcoming/draft seasons:
 * - Team registration interface
 * - Season setup and planning tools
 * - Rules configuration
 * - Pre-season preparation
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users,
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  FileText,
  AlertTriangle,
  Trophy,
  Target,
  MapPin,
  Loader2,
  AlertCircle,
  Play,
  Clipboard
} from 'lucide-react';
import SeasonDashboardLayout from '@/components/leagues/dashboards/SeasonDashboardLayout';
import { TeamJoinRequestModal } from '@/components/seasons/TeamJoinRequestModal';

interface TeamRegistration {
  id: string;
  name: string;
  captain: string;
  members: number;
  maxMembers: number;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  contactEmail: string;
}

interface SeasonSetup {
  registrationOpen: boolean;
  registrationDeadline: string;
  seasonStart: string;
  seasonEnd: string;
  maxTeams: number;
  minTeams: number;
  currentRegistrations: number;
  rulesPublished: boolean;
  fixturesGenerated: boolean;
  venuesConfirmed: boolean;
}

export default function DraftSeasonDashboard() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [activeTab, setActiveTab] = useState<'registration' | 'setup' | 'teams' | 'planning'>('registration');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [seasonSetup, setSeasonSetup] = useState<SeasonSetup>({
    registrationOpen: true,
    registrationDeadline: '',
    seasonStart: '',
    seasonEnd: '',
    maxTeams: 0,
    minTeams: 0,
    currentRegistrations: 0,
    rulesPublished: false,
    fixturesGenerated: false,
    venuesConfirmed: false
  });

  // Load season data
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const season = result.data?.find((s: any) => s.id === seasonId);

          if (season) {
            setSeasonData(season);

            // Transform teams data to TeamRegistration format
            const teams: TeamRegistration[] = (season.teams || []).map((teamReg: any) => ({
              id: teamReg.team_id,
              name: teamReg.team?.name || 'Unknown Team',
              captain: 'Captain', // TODO: Add captain info to API response
              members: teamReg.team?.currentPlayers?.[0]?.count || 0,
              maxMembers: 22, // TODO: Add max members to team data
              status: teamReg.status === 'registered' || teamReg.status === 'confirmed' ? 'approved' : 'pending',
              registrationDate: teamReg.registration_date || teamReg.created_at,
              contactEmail: 'contact@team.com' // TODO: Add contact email to API response
            }));

            setTeamRegistrations(teams);

            // Set up season setup data
            setSeasonSetup({
              registrationOpen: season.status === 'draft' || season.status === 'registration',
              registrationDeadline: season.registration_deadline || '',
              seasonStart: season.start_date || '',
              seasonEnd: season.end_date || '',
              maxTeams: season.max_teams || 0,
              minTeams: season.min_teams || 0,
              currentRegistrations: teams.length,
              rulesPublished: !!season.rules,
              fixturesGenerated: season.fixtures_status === 'generated',
              venuesConfirmed: false // TODO: Add venue confirmation status
            });
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

  // Handle join request submitted
  const handleJoinRequestSubmitted = useCallback(() => {
    setShowJoinModal(false);
    // Optionally refresh registration data here
  }, []);

  // Helper functions
  const getRegistrationProgress = () => {
    return Math.min((seasonSetup.currentRegistrations / seasonSetup.minTeams) * 100, 100);
  };

  const getDaysUntilDeadline = () => {
    const deadline = new Date(seasonSetup.registrationDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSetupProgress = () => {
    const tasks = [
      seasonSetup.rulesPublished,
      seasonSetup.currentRegistrations >= seasonSetup.minTeams,
      seasonSetup.fixturesGenerated,
      seasonSetup.venuesConfirmed
    ];
    const completed = tasks.filter(Boolean).length;
    return (completed / tasks.length) * 100;
  };

  const availableTabs = ['registration', 'setup', 'teams', 'planning'];

  if (loading) {
    return (
      <SeasonDashboardLayout
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        availableTabs={availableTabs}
        title="Upcoming Season - Planning Phase"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading season setup...</span>
        </div>
      </SeasonDashboardLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'registration':
        return (
          <div className="space-y-8">
            {/* Registration Status */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Team Registration {seasonSetup.registrationOpen ? 'Open' : 'Closed'}
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {getDaysUntilDeadline() > 0 
                        ? `${getDaysUntilDeadline()} days remaining until deadline`
                        : 'Registration deadline has passed'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {seasonSetup.currentRegistrations} / {seasonSetup.maxTeams}
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
                {seasonSetup.currentRegistrations >= seasonSetup.minTeams 
                  ? '✅ Minimum teams registered - season can proceed'
                  : `⏳ Need ${seasonSetup.minTeams - seasonSetup.currentRegistrations} more teams to start season`
                }
              </div>
            </div>

            {/* Join Season Section - Only show for draft/upcoming seasons */}
            {seasonData && (seasonData.status === 'draft' || seasonData.status === 'registration') && seasonSetup.registrationOpen && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Join This Season
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Request to register your team for this {seasonData.status} season
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Submit a registration request for your team. League administrators will review your application and notify you of the decision.
                  </p>
                </div>
              </div>
            )}

            {/* Show message when registration is not available */}
            {seasonData && seasonData.status !== 'draft' && seasonData.status !== 'registration' && (
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Registration Closed
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This season is currently <span className="font-medium capitalize">{seasonData.status}</span> and not accepting new team registrations.
                </p>
              </div>
            )}

            {/* Team Registration List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Applications
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {teamRegistrations.filter(t => t.status === 'pending').length} pending review
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {teamRegistrations.map((team) => (
                  <div key={team.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{team.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            team.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : team.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {team.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Captain:</span> {team.captain}
                          </div>
                          <div>
                            <span className="font-medium">Players:</span> {team.members}/{team.maxMembers}
                          </div>
                          <div>
                            <span className="font-medium">Registered:</span> {new Date(team.registrationDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {team.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors">
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {teamRegistrations.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No team applications yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Registration Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registration Deadline
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {new Date(seasonSetup.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Limits
                  </label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      Min: {seasonSetup.minTeams}, Max: {seasonSetup.maxTeams}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Update Settings
                </button>
                <button className={`px-4 py-2 rounded-lg transition-colors ${
                  seasonSetup.registrationOpen
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}>
                  {seasonSetup.registrationOpen ? 'Close Registration' : 'Open Registration'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-8">
            {/* Setup Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Season Setup Progress
                </h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getSetupProgress().toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${getSetupProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  seasonSetup.rulesPublished 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  {seasonSetup.rulesPublished ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Season Rules</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {seasonSetup.rulesPublished ? 'Published' : 'Needs review'}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  seasonSetup.currentRegistrations >= seasonSetup.minTeams 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  {seasonSetup.currentRegistrations >= seasonSetup.minTeams ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Team Registration</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {seasonSetup.currentRegistrations >= seasonSetup.minTeams ? 'Sufficient teams' : 'More teams needed'}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  seasonSetup.fixturesGenerated 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}>
                  {seasonSetup.fixturesGenerated ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Match Fixtures</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {seasonSetup.fixturesGenerated ? 'Generated' : 'Pending team confirmations'}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  seasonSetup.venuesConfirmed 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}>
                  {seasonSetup.venuesConfirmed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Venues</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {seasonSetup.venuesConfirmed ? 'Confirmed' : 'Pending confirmation'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Action Items
              </h3>
              <div className="space-y-4">
                {!seasonSetup.rulesPublished && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Publish Season Rules</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Review and publish official competition rules</div>
                      </div>
                    </div>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                      Publish
                    </button>
                  </div>
                )}

                {seasonSetup.currentRegistrations >= seasonSetup.minTeams && !seasonSetup.fixturesGenerated && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Generate Match Fixtures</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Create the full season schedule</div>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Generate
                    </button>
                  </div>
                )}

                {!seasonSetup.venuesConfirmed && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Confirm Match Venues</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Secure and confirm all match locations</div>
                      </div>
                    </div>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Manage
                    </button>
                  </div>
                )}

                {getSetupProgress() === 100 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Ready to Start Season</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">All setup tasks completed - season can begin</div>
                      </div>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Start Season
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-8">
            {/* Team Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Registered Teams ({teamRegistrations.filter(t => t.status === 'approved').length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamRegistrations
                  .filter(team => team.status === 'approved')
                  .map((team) => (
                    <div key={team.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{team.name}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                          Approved
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Captain:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{team.captain}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Squad Size:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{team.members}/{team.maxMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Registered:</span>
                          <span>{new Date(team.registrationDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                            style={{ width: `${(team.members / team.maxMembers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Squad: {((team.members / team.maxMembers) * 100).toFixed(0)}% full
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {teamRegistrations.filter(t => t.status === 'approved').length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No teams approved yet</p>
                </div>
              )}
            </div>

            {/* Team Requirements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Team Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Squad Requirements</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Minimum 15 players
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Maximum 22 players
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      At least 2 goalkeepers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Designated captain
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Documentation</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Team registration form
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Player eligibility documents
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Insurance certificates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Contact information
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-8">
            {/* Season Overview */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clipboard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Season Planning</h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Comprehensive preparation for the upcoming season
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {new Date(seasonSetup.seasonStart).toLocaleDateString()}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">Season Start</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {seasonSetup.maxTeams}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">Max Teams</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {getDaysUntilDeadline()}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">Days to Start</div>
                </div>
              </div>
            </div>

            {/* Planning Checklist */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-blue-600" />
                Pre-Season Checklist
              </h3>
              
              <div className="space-y-4">
                {[
                  { task: 'Publish season rules and regulations', completed: seasonSetup.rulesPublished },
                  { task: 'Reach minimum team registrations', completed: seasonSetup.currentRegistrations >= seasonSetup.minTeams },
                  { task: 'Review and approve all team applications', completed: false },
                  { task: 'Generate match fixtures and schedule', completed: seasonSetup.fixturesGenerated },
                  { task: 'Confirm match venues and facilities', completed: seasonSetup.venuesConfirmed },
                  { task: 'Set up referee assignments', completed: false },
                  { task: 'Prepare match day protocols', completed: false },
                  { task: 'Test scoring and statistics systems', completed: false },
                  { task: 'Communicate season details to teams', completed: false },
                  { task: 'Conduct pre-season team briefing', completed: false }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.completed 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}>
                    {item.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded-full flex-shrink-0"></div>
                    )}
                    <div className={`font-medium ${
                      item.completed 
                        ? 'text-green-900 dark:text-green-100 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.task}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Season Statistics Projection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Season Projections
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {seasonSetup.currentRegistrations * (seasonSetup.currentRegistrations - 1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.ceil((seasonSetup.currentRegistrations * (seasonSetup.currentRegistrations - 1)) / 4)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Match Days</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    ~{seasonSetup.currentRegistrations * 18}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.ceil((new Date(seasonSetup.seasonEnd).getTime() - new Date(seasonSetup.seasonStart).getTime()) / (1000 * 60 * 60 * 24 * 7))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Weeks Duration</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SeasonDashboardLayout
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        availableTabs={availableTabs}
        title="Upcoming Season - Planning Phase"
      >
        {renderContent()}
      </SeasonDashboardLayout>

      {/* Join Request Modal */}
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