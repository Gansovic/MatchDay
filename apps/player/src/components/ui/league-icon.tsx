'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, Loader2 } from 'lucide-react';
import { getLeagueIcon } from '@/lib/utils/icon-helpers';

interface LeagueIconProps {
  leagueId: string;
  leagueName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export function LeagueIcon({
  leagueId,
  leagueName,
  size = 'md',
  className = '',
  showFallback = true
}: LeagueIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadIcon = async () => {
      try {
        setIsLoading(true);
        const icon = await getLeagueIcon(leagueId);
        if (mounted) {
          setIconUrl(icon?.url || null);
          setError(!icon);
        }
      } catch (err) {
        console.error('Error loading league icon:', err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
    };
  }, [leagueId]);

  const containerClass = `relative ${sizeClasses[size]} ${className} rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0`;

  if (isLoading) {
    return (
      <div className={containerClass}>
        <Loader2 className={`${iconSizes[size]} text-gray-400 animate-spin`} />
      </div>
    );
  }

  if (iconUrl && !error) {
    return (
      <div className={containerClass}>
        <Image
          src={iconUrl}
          alt={`${leagueName} icon`}
          fill
          className="object-contain p-2"
          sizes={`(max-width: 768px) 100vw, ${sizeClasses[size]}`}
        />
      </div>
    );
  }

  if (showFallback) {
    return (
      <div className={containerClass}>
        <Trophy className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return null;
}
