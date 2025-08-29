/**
 * My Teams Page
 * 
 * Comprehensive team management interface where users can:
 * - View all teams they're part of
 * - See team statistics and standings
 * - Manage team memberships
 * - Browse available teams to join
 * - Track upcoming matches
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  UserPlus,
  Search,
  Filter,
  Crown,
  Target,
  Clock
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  league: string;
  sport: string;
  logo?: string;
  position: string;
  isCaptain: boolean;
  memberCount: number;
  maxMembers: number;
  nextMatch?: {
    opponent: string;
    date: string;
    venue: string;
  };
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    position: number;
    totalTeams: number;
  };
  color: string;
}

interface AvailableTeam {
  id: string;
  name: string;
  league: string;
  sport: string;
  logo?: string;
  memberCount: number;
  maxMembers: number;
  isRecruiting: boolean;
  requiredPosition?: string;
  location: string;
  nextMatch?: string;
  color: string;
}

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<'my-teams' | 'discover'>('my-teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  // Mock data for demonstration
  const myTeams: Team[] = [
    {
      id: '1',
      name: 'Thunder Eagles',
      league: 'Metropolitan Football League',
      sport: 'Football',
      position: 'Midfielder',
      isCaptain: true,
      memberCount: 18,
      maxMembers: 22,
      nextMatch: {
        opponent: 'City Wolves',
        date: '2024-08-20T15:00:00',
        venue: 'Central Stadium'
      },
      stats: {
        wins: 12,
        draws: 3,
        losses: 2,
        goals: 45,
        position: 2,
        totalTeams: 16
      },
      color: 'bg-blue-600'
    },
    {
      id: '2',
      name: 'Phoenix Basketball',
      league: 'City Basketball Association',
      sport: 'Basketball',
      position: 'Point Guard',
      isCaptain: false,
      memberCount: 12,
      maxMembers: 15,
      nextMatch: {
        opponent: 'Storm Riders',
        date: '2024-08-22T18:30:00',
        venue: 'Sports Complex Arena'
      },
      stats: {
        wins: 8,
        draws: 0,
        losses: 4,
        goals: 0,
        position: 4,
        totalTeams: 12
      },
      color: 'bg-orange-600'
    }
  ];

  const availableTeams: AvailableTeam[] = [
    {
      id: '3',
      name: 'Velocity United',
      league: 'Elite Soccer League',
      sport: 'Football',
      memberCount: 16,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Defender',
      location: 'North District',
      nextMatch: '2024-08-25',
      color: 'bg-green-600'
    },
    {
      id: '4',
      name: 'Coastal Sharks',
      league: 'Regional Basketball League',
      sport: 'Basketball',
      memberCount: 10,
      maxMembers: 15,
      isRecruiting: true,
      location: 'Coastal Area',
      nextMatch: '2024-08-23',
      color: 'bg-teal-600'
    },
    {
      id: '5',
      name: 'Rapid Strikers',
      league: 'Weekend Football Division',
      sport: 'Football',
      memberCount: 20,
      maxMembers: 22,
      isRecruiting: true,
      requiredPosition: 'Goalkeeper',
      location: 'South Stadium',
      color: 'bg-red-600'
    }
  ];

  const sports = ['all', 'Football', 'Basketball', 'Volleyball', 'Tennis'];

  const filteredAvailableTeams = availableTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.league.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || team.sport === selectedSport;
    return matchesSearch && matchesSport && team.isRecruiting;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateWinRate = (wins: number, draws: number, losses: number) => {
    const total = wins + draws + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Teams
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your teams, track performance, and discover new opportunities
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-teams'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  My Teams ({myTeams.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'discover'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Discover Teams
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* My Teams Tab */}
        {activeTab === 'my-teams' && (
          <div className="space-y-6">
            {myTeams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No teams yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven&apos;t joined any teams. Start by discovering teams in your area.
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Discover Teams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myTeams.map((team) => (
                  <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                    {/* Team Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${team.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {team.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {team.league}
                          </p>
                        </div>
                      </div>
                      {team.isCaptain && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                          <Crown className="w-3 h-3" />
                          Captain
                        </div>
                      )}
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats.position}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          of {team.stats.totalTeams}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Position</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {calculateWinRate(team.stats.wins, team.stats.draws, team.stats.losses)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.memberCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          of {team.maxMembers}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Members</div>
                      </div>
                    </div>

                    {/* Position & Role */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4" />
                        Your Position: <span className="font-medium">{team.position}</span>
                      </div>
                    </div>

                    {/* Next Match */}
                    {team.nextMatch && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
                          <Clock className="w-4 h-4" />
                          Next Match
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div>vs {team.nextMatch.opponent}</div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>{formatDate(team.nextMatch.date)}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {team.nextMatch.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
                        View Details
                      </button>
                      {team.isCaptain && (
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Teams Tab */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search teams or leagues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sports.map(sport => (
                        <option key={sport} value={sport}>
                          {sport === 'all' ? 'All Sports' : sport}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableTeams.map((team) => (
                <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  {/* Team Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${team.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {team.sport}
                      </p>
                    </div>
                  </div>

                  {/* Team Info */}
                  <div className="space-y-3 mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-white">{team.league}</strong>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {team.location}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      {team.memberCount}/{team.maxMembers} members
                    </div>

                    {team.requiredPosition && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          Looking for: {team.requiredPosition}
                        </span>
                      </div>
                    )}

                    {team.nextMatch && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Next match: {new Date(team.nextMatch).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Join Button */}
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                    <UserPlus className="w-4 h-4" />
                    Request to Join
                  </button>
                </div>
              ))}
            </div>

            {filteredAvailableTeams.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No teams found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria or check back later for new teams.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}