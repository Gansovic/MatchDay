import { PlayerStatRow } from '@/hooks/useSeasonLeaderboards';

interface LeaderboardCardProps {
  title: string;
  data: PlayerStatRow[];
  statLabel: string;
}

export function LeaderboardCard({ title, data, statLabel }: LeaderboardCardProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-1 text-xs font-medium text-gray-500 dark:text-gray-400">#</div>
          <div className="col-span-5 text-xs font-medium text-gray-500 dark:text-gray-400">Player</div>
          <div className="col-span-4 text-xs font-medium text-gray-500 dark:text-gray-400">Team</div>
          <div className="col-span-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">{statLabel}</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((player, index) => (
            <div
              key={player.id}
              className={`grid grid-cols-12 gap-2 px-3 py-3 ${
                index === 0
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : index === 1
                  ? 'bg-gray-50 dark:bg-gray-700/30'
                  : index === 2
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : ''
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span
                  className={`text-sm font-semibold ${
                    index < 3
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              {/* Player Name */}
              <div className="col-span-5 flex flex-col justify-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {player.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {player.matches_played} {player.matches_played === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {/* Team */}
              <div className="col-span-4 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.team_color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {player.team}
                </span>
              </div>

              {/* Stat Value */}
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {player.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
