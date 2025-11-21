'use client';

import { useState } from 'react';
import { useSeasonLeaderboards } from '@/hooks/useSeasonLeaderboards';
import { LeaderboardCard } from './LeaderboardCard';
import { Target, Users, Award, Shield } from 'lucide-react';

interface LeaderboardsSectionProps {
  seasonId: string;
  leagueId: string;
}

type LeaderboardTab = 'goals' | 'assists' | 'motm' | 'cleanSheets';

export function LeaderboardsSection({ seasonId, leagueId }: LeaderboardsSectionProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('goals');
  const { data, loading, error } = useSeasonLeaderboards(seasonId, leagueId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  const hasAnyData =
    (data?.topScorers?.length || 0) > 0 ||
    (data?.topAssists?.length || 0) > 0 ||
    (data?.cleanSheets?.length || 0) > 0 ||
    (data?.manOfTheMatch?.length || 0) > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Statistics Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Player statistics will appear once matches are played and stats are recorded
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'goals' as const, label: 'Top Scorers', icon: Target },
    { id: 'assists' as const, label: 'Top Assists', icon: Users },
    { id: 'motm' as const, label: 'Man of the Match', icon: Award },
    { id: 'cleanSheets' as const, label: 'Clean Sheets', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'goals' && (
          <LeaderboardCard
            title="Top Scorers"
            data={data?.topScorers || []}
            statLabel="Goals"
          />
        )}
        {activeTab === 'assists' && (
          <LeaderboardCard
            title="Top Assists"
            data={data?.topAssists || []}
            statLabel="Assists"
          />
        )}
        {activeTab === 'motm' && (
          <LeaderboardCard
            title="Man of the Match"
            data={data?.manOfTheMatch || []}
            statLabel="MOTM"
          />
        )}
        {activeTab === 'cleanSheets' && (
          <LeaderboardCard
            title="Clean Sheets"
            data={data?.cleanSheets || []}
            statLabel="CS"
          />
        )}
      </div>
    </div>
  );
}
