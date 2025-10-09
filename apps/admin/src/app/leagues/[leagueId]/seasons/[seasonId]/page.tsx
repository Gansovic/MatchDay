'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Calendar, Settings } from 'lucide-react';

export default function AdminSeasonDashboard() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [seasonData, setSeasonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadSeasonData();
  }, [leagueId, seasonId]);

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

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to League
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {seasonData.display_name || seasonData.name}
              </h1>
              <p className="text-gray-400">{seasonData.season_year}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                seasonData.status === 'active' ? 'bg-green-900/30 text-green-300' :
                seasonData.status === 'draft' ? 'bg-yellow-900/30 text-yellow-300' :
                seasonData.status === 'registration' ? 'bg-blue-900/30 text-blue-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {seasonData.status.charAt(0).toUpperCase() + seasonData.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Season Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Teams</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {seasonData.registered_teams_count || 0}
              {seasonData.max_teams && <span className="text-lg text-gray-400"> / {seasonData.max_teams}</span>}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Duration</h3>
            </div>
            <p className="text-sm text-gray-400">
              {new Date(seasonData.start_date).toLocaleDateString()} - {new Date(seasonData.end_date).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Format</h3>
            </div>
            <p className="text-sm text-gray-400 capitalize">{seasonData.tournament_format}</p>
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Registered Teams</h2>
          {seasonData.teams && seasonData.teams.length > 0 ? (
            <div className="space-y-3">
              {seasonData.teams.map((teamReg: any) => (
                <div
                  key={teamReg.team_id}
                  className="border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: teamReg.team?.team_color || '#374151' }}
                    >
                      <span className="text-white font-bold text-lg">
                        {teamReg.team?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{teamReg.team?.name || 'Unknown Team'}</h3>
                      <p className="text-sm text-gray-400">
                        Registered: {new Date(teamReg.registration_date || teamReg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    teamReg.status === 'registered' || teamReg.status === 'confirmed'
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {teamReg.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No teams registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
