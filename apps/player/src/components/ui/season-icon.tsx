'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Loader2 } from 'lucide-react';
import { getSeasonIcon } from '@/lib/utils/icon-helpers';

interface SeasonIconProps {
  seasonId: string;
  leagueId: string;
  seasonName: string;
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

export function SeasonIcon({
  seasonId,
  leagueId,
  seasonName,
  size = 'md',
  className = '',
  showFallback = true
}: SeasonIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadIcon = async () => {
      try {
        setIsLoading(true);
        // getSeasonIcon automatically falls back to league icon
        const icon = await getSeasonIcon(seasonId, leagueId);
        if (mounted) {
          setIconUrl(icon?.url || null);
          setError(!icon);
        }
      } catch (err) {
        console.error('Error loading season icon:', err);
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
  }, [seasonId, leagueId]);

  const containerClass = `relative ${sizeClasses[size]} ${className} rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0`;

  if (isLoading) {
    return (
      <div className={containerClass}>
        <Loader2 className={`${iconSizes[size]} text-blue-400 animate-spin`} />
      </div>
    );
  }

  if (iconUrl && !error) {
    return (
      <div className={containerClass}>
        <Image
          src={iconUrl}
          alt={`${seasonName} icon`}
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
        <Calendar className={`${iconSizes[size]} text-blue-400`} />
      </div>
    );
  }

  return null;
}
