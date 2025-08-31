'use client';

import React, { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  league_id: string | null;
  captain_id: string;
  max_players: number;
  team_color: string;
  created_at: string;
}

interface TeamMember {
  team_id: string;
  team_name: string;
  user_id: string;
  position: string;
  jersey_number: number;
  is_active: boolean;
}

interface League {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
}

interface SummaryItem {
  table_name: string;
  count: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  position: string | null;
  role: string;
  bio: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function DatabaseViewer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [teamsRes, membersRes, leaguesRes, usersRes, summaryRes] = await Promise.all([
        fetch('/api/database/teams'),
        fetch('/api/database/members'),
        fetch('/api/database/leagues'),
        fetch('/api/database/users'),
        fetch('/api/database/summary')
      ]);

      if (!teamsRes.ok || !membersRes.ok || !leaguesRes.ok || !usersRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [teamsData, membersData, leaguesData, usersData, summaryData] = await Promise.all([
        teamsRes.json(),
        membersRes.json(),
        leaguesRes.json(),
        usersRes.json(),
        summaryRes.json()
      ]);

      setTeams(teamsData.teams || []);
      setMembers(membersData.members || []);
      setLeagues(leaguesData.leagues || []);
      setUsers(usersData.users || []);
      setSummary(summaryData.summary || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading database data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🏈 MatchDay Database Viewer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time view of your PostgreSQL database
            </p>
            <button
              onClick={fetchData}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {summary.map((item) => (
              <div key={item.table_name} className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                <h3 className="text-sm font-medium opacity-90">{item.table_name}</h3>
                <p className="text-2xl font-bold">{item.count}</p>
              </div>
            ))}
          </div>

          {/* Teams Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📊 Teams ({teams.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">League</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Players</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {team.league_id ? 'League Assigned' : 'Independent'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {team.max_players}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: team.team_color }}
                          ></div>
                          <span className="text-gray-600 dark:text-gray-400">{team.team_color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              👤 Registered Users ({users.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.phone || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : user.role === 'captain'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {user.position || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              👥 Team Members ({members.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jersey</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member, index) => (
                    <tr key={`${member.team_id}-${member.user_id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {member.team_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {member.position}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        #{member.jersey_number}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leagues Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🏆 Leagues ({leagues.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leagues.map((league) => (
                <div key={league.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{league.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{league.description}</p>
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      league.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {league.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      league.is_public
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                    }`}>
                      {league.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}