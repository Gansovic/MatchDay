/**
 * ProfileHeader Component
 *
 * Playtomic-style player profile header with avatar, name, level badge, and location.
 * Similar to Playtomic's profile header design.
 */

'use client';

import React from 'react';
import { MapPin, Edit, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  preferredPosition?: string;
  location?: string;
  avatarUrl?: string;
  playerLevel: number;
  reliabilityPercentage?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  email,
  preferredPosition,
  location,
  avatarUrl,
  playerLevel,
  reliabilityPercentage
}) => {
  const router = useRouter();

  // Get level color based on value
  const getLevelColor = (level: number) => {
    if (level >= 9.0) return 'from-yellow-500 to-orange-500'; // Elite
    if (level >= 7.5) return 'from-green-500 to-emerald-500'; // Advanced
    if (level >= 5.0) return 'from-blue-500 to-cyan-500';     // Intermediate
    return 'from-gray-500 to-slate-500';                       // Beginner
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
      <div className="flex items-start justify-between">
        {/* Left Side: Avatar + Info */}
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100 dark:ring-blue-900/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            {/* Level Badge Overlay */}
            <div className={`absolute -bottom-2 -right-2 bg-gradient-to-r ${getLevelColor(playerLevel)} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
              {playerLevel.toFixed(1)}
            </div>
          </div>

          {/* Player Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {displayName}
            </h1>

            <div className="flex items-center gap-3 mb-2">
              {preferredPosition && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                  {preferredPosition}
                </span>
              )}

              {reliabilityPercentage !== undefined && reliabilityPercentage >= 80 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{reliabilityPercentage}% Reliable</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
              <span className="text-gray-400">•</span>
              <span>{email}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Button */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
        >
          <Edit className="w-4 h-4" />
          <span className="font-medium">Edit Profile</span>
        </button>
      </div>

      {/* Player Level Description */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Player Level
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {playerLevel >= 9.0 && 'Elite • Top tier player with exceptional skills'}
              {playerLevel >= 7.5 && playerLevel < 9.0 && 'Advanced • Strong competitive player'}
              {playerLevel >= 5.0 && playerLevel < 7.5 && 'Intermediate • Developing skills and consistency'}
              {playerLevel < 5.0 && 'Beginner • Building fundamental skills'}
            </p>
          </div>

          {reliabilityPercentage !== undefined && (
            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Reliability
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reliabilityPercentage}% match attendance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
