'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trophy, Users, Calendar, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { CreateLeagueModal } from '@/components/league/CreateLeagueModal';
import { LeagueService } from '@/lib/services/league.service';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function LeaguesPage() {
  const { user, loading } = useAuth();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await LeagueService.getLeagues(filters);
      setLeagues(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leagues');
      setLeagues([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeagues();
    }
  }, [user?.id, statusFilter]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access the league management.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async (leagueId: string) => {
    if (!confirm('Are you sure you want to archive this league?')) return;

    try {
      await LeagueService.deleteLeague(leagueId);
      fetchLeagues();
    } catch (err: any) {
      alert(err.message || 'Failed to delete league');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-700 text-gray-300',
      registration: 'bg-blue-900 text-blue-300',
      active: 'bg-green-900 text-green-300',
      completed: 'bg-purple-900 text-purple-300',
      archived: 'bg-red-900 text-red-300'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">League Management</h1>
            <p className="text-gray-400">Create and manage sports leagues</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create League
          </button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && fetchLeagues()}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="registration">Registration</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-400">Loading leagues...</p>
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 border border-gray-700 rounded-lg">
            <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Leagues Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first league to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create First League
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{league.name}</h3>
                    <p className="text-gray-400">{league.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(league.status)}`}>
                    {league.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm">{league.sport_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {league.league_teams?.length || 0}/{league.max_teams} teams
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(league.season_start).toLocaleDateString()}
                    </span>
                  </div>
                  {league.location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{league.location}</span>
                    </div>
                  )}
                </div>

                {(league.entry_fee > 0 || league.prize_pool > 0) && (
                  <div className="flex gap-4 mb-4 text-sm">
                    {league.entry_fee > 0 && (
                      <span className="text-blue-400">Entry: ${league.entry_fee}</span>
                    )}
                    {league.prize_pool > 0 && (
                      <span className="text-green-400">Prize: ${league.prize_pool}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/leagues/${league.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/leagues/${league.id}/edit`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(league.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-900 text-red-300 rounded hover:bg-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateLeagueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchLeagues}
          userId={user?.id}
        />
      </div>
    </div>
  );
}