'use client';

import React from 'react';
import Image from 'next/image';

interface TeamLogoProps {
  name: string;
  logoUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base'
};

const imageSizes = {
  sm: 24,
  md: 32,
  lg: 40
};

export function TeamLogo({
  name,
  logoUrl,
  color,
  size = 'md',
  className = ''
}: TeamLogoProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const backgroundColor = color || '#374151';
  const sizeClass = sizeClasses[size];
  const imageSize = imageSizes[size];

  return (
    <div
      className={`rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClass} ${className} ${
        logoUrl ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600' : ''
      }`}
      style={!logoUrl ? { backgroundColor } : {}}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          width={imageSize}
          height={imageSize}
          className="object-contain p-0.5"
          unoptimized
        />
      ) : (
        <span className="text-white font-bold">
          {initial}
        </span>
      )}
    </div>
  );
}
