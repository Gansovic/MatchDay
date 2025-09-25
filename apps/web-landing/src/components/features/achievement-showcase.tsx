/**
 * Achievement Showcase Component
 * 
 * Professional-looking achievement display that makes amateur players feel
 * like professionals through beautiful badge displays and progress tracking.
 * 
 * @example
 * ```typescript
 * <AchievementShowcase userId={userId} compact={false} />
 * ```
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { AchievementService, AchievementProgress, AchievementCategory } from '@/lib/services/achievement.service';
import { NumberFormatters } from '@/lib/utils/formatters';

interface AchievementShowcaseProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

const AchievementBadge: React.FC<{
  achievement: AchievementProgress;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}> = ({ achievement, size = 'medium', showProgress = true }) => {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-20 h-20 text-3xl',
    large: 'w-24 h-24 text-4xl'
  };

  const getRarityColor = (rarity: number) => {
    if (rarity < 5) return 'from-purple-400 to-pink-400'; // Legendary
    if (rarity < 15) return 'from-yellow-400 to-orange-400'; // Epic
    if (rarity < 35) return 'from-blue-400 to-indigo-400'; // Rare
    return 'from-gray-400 to-gray-500'; // Common
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity < 5) return 'Legendary';
    if (rarity < 15) return 'Epic';
    if (rarity < 35) return 'Rare';
    return 'Common';
  };

  return (
    <div className="relative group">
      <div 
        className={`
          ${sizeClasses[size]} 
          relative rounded-full border-4 border-white shadow-lg
          ${achievement.isCompleted 
            ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}` 
            : 'bg-gray-200 dark:bg-gray-700'
          }
          flex items-center justify-center
          transition-transform hover:scale-110
        `}
      >
        <span className={achievement.isCompleted ? 'text-white' : 'text-gray-400'}>
          {achievement.icon}
        </span>
        
        {!achievement.isCompleted && showProgress && achievement.progressPercentage > 0 && (
          <div className="absolute inset-0 rounded-full border-4 border-transparent">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-blue-500"
                strokeDasharray={`${achievement.progressPercentage * 2.83} 283`}
                opacity="0.8"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-black text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap">
          <div className="font-semibold">{achievement.name}</div>
          <div className="text-xs opacity-75">{achievement.description}</div>
          {achievement.isCompleted ? (
            <div className="text-xs text-green-400">
              {getRarityLabel(achievement.rarity)} • {achievement.pointsValue} pts
            </div>
          ) : (
            <div className="text-xs text-blue-400">
              Progress: {achievement.currentProgress}/{achievement.requiredProgress}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategorySection: React.FC<{
  category: AchievementCategory;
  expanded: boolean;
  onToggle: () => void;
}> = ({ category, expanded, onToggle }) => {
  const completionPercentage = (category.completedCount / category.totalCount) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {category.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {category.description}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {category.completedCount}/{category.totalCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {completionPercentage.toFixed(0)}% complete
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {category.achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.achievementId}
                achievement={achievement}
                size="small"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({
  userId,
  compact = false,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: achievementData, isLoading, error } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => AchievementService.getInstance().getUserAchievements(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  if (error || !achievementData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load achievements</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Summary Card */}
        <ProfessionalCard
          title="Achievements"
          variant="player"
          stats={[
            { label: 'Earned', value: achievementData.totalAchievements, highlight: true },
            { label: 'Points', value: NumberFormatters.formatPoints(achievementData.totalPoints) },
            { label: 'Global Rank', value: `#${achievementData.globalRank}` }
          ]}
        />

        {/* Recent Achievements */}
        {achievementData.recentAchievements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Recent Achievements
            </h3>
            <div className="flex gap-2 overflow-x-auto">
              {achievementData.recentAchievements.slice(0, 5).map((recent) => (
                <div key={recent.achievement.id} className="flex-shrink-0">
                  <AchievementBadge
                    achievement={{
                      achievementId: recent.achievement.id,
                      name: recent.achievement.name,
                      description: recent.achievement.description || '',
                      category: recent.achievement.category || '',
                      icon: recent.achievement.icon || '🏆',
                      pointsValue: recent.achievement.points_value || 0,
                      currentProgress: 1,
                      requiredProgress: 1,
                      progressPercentage: 100,
                      isCompleted: true,
                      completedAt: recent.earnedAt,
                      rarity: recent.rarity
                    }}
                    size="small"
                    showProgress={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProfessionalCard
          title="Total Achievements"
          stats={[{ label: 'Earned', value: achievementData.totalAchievements, highlight: true }]}
          variant="player"
        />
        <ProfessionalCard
          title="Achievement Points"
          stats={[{ label: 'Points', value: achievementData.totalPoints, highlight: true }]}
          variant="player"
        />
        <ProfessionalCard
          title="Global Ranking"
          stats={[{ label: 'Rank', value: `#${achievementData.globalRank}`, highlight: true }]}
          variant="player"
        />
        <ProfessionalCard
          title="Top Percentile"
          stats={[{ label: 'Percentile', value: `${achievementData.percentileRank}%`, highlight: true }]}
          variant="player"
        />
      </div>

      {/* Recent Achievements */}
      {achievementData.recentAchievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Achievements
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
            {achievementData.recentAchievements.map((recent) => (
              <AchievementBadge
                key={recent.achievement.id}
                achievement={{
                  achievementId: recent.achievement.id,
                  name: recent.achievement.name,
                  description: recent.achievement.description || '',
                  category: recent.achievement.category || '',
                  icon: recent.achievement.icon || '🏆',
                  pointsValue: recent.achievement.points_value || 0,
                  currentProgress: 1,
                  requiredProgress: 1,
                  progressPercentage: 100,
                  isCompleted: true,
                  completedAt: recent.earnedAt,
                  rarity: recent.rarity
                }}
                size="medium"
                showProgress={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Next Milestones */}
      {achievementData.nextMilestones.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Next Milestones
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
            {achievementData.nextMilestones.map((milestone) => (
              <AchievementBadge
                key={milestone.achievement.id}
                achievement={{
                  achievementId: milestone.achievement.id,
                  name: milestone.achievement.name,
                  description: milestone.achievement.description || '',
                  category: milestone.achievement.category || '',
                  icon: milestone.achievement.icon || '🏆',
                  pointsValue: milestone.achievement.points_value || 0,
                  currentProgress: milestone.progress,
                  requiredProgress: 100,
                  progressPercentage: milestone.progress,
                  isCompleted: false,
                  rarity: 0
                }}
                size="medium"
              />
            ))}
          </div>
        </div>
      )}

      {/* Achievement Categories */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          All Achievements
        </h2>
        {achievementData.categories.map((category) => (
          <CategorySection
            key={category.name}
            category={category}
            expanded={expandedCategories.has(category.name)}
            onToggle={() => toggleCategory(category.name)}
          />
        ))}
      </div>
    </div>
  );
};