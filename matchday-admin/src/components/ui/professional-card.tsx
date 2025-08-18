/**
 * Professional Card Component
 * 
 * A reusable card component that gives amateur players a professional appearance.
 * Follows LEVER principles by being highly reusable and customizable.
 * 
 * @example
 * ```typescript
 * <ProfessionalCard
 *   title="Player Profile"
 *   subtitle="Forward"
 *   image="/player-avatar.jpg"
 *   stats={[
 *     { label: "Goals", value: 15 },
 *     { label: "Assists", value: 8 }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import Image from 'next/image';

interface Stat {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface ProfessionalCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  stats?: Stat[];
  badges?: string[];
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: 'default' | 'player' | 'team' | 'match';
}

export const ProfessionalCard = React.memo<ProfessionalCardProps>(({
  title,
  subtitle,
  image,
  stats = [],
  badges = [],
  className = '',
  onClick,
  children,
  variant = 'default'
}) => {
  const baseClasses = [
    'bg-white dark:bg-gray-800',
    'border border-gray-200 dark:border-gray-700',
    'rounded-xl shadow-sm hover:shadow-md',
    'transition-all duration-200',
    'p-6',
    onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
  ].filter(Boolean).join(' ');

  const variantClasses = {
    default: '',
    player: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    team: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    match: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {/* Header Section */}
      <div className="flex items-start gap-4 mb-4">
        {image && (
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-bold ${
                stat.highlight 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Children Content */}
      {children && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
});

ProfessionalCard.displayName = 'ProfessionalCard';