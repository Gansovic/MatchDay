/**
 * Professional Header Component
 * 
 * Main navigation header that makes amateur players feel like they're using
 * a professional sports platform. Includes MatchDay branding and key navigation.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/auth/dev-auth-provider';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'My Dashboard', icon: '📊' },
    { href: '/leagues', label: 'Explore Leagues', icon: '🏆' },
    { href: '/teams', label: 'My Teams', icon: '👥' },
    { href: '/matches', label: 'Matches', icon: '⚽' },
    { href: '/profile', label: 'Profile Settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      
      // Force a hard reload to clear all cached data
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    }
  };

  return (
    <header className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MatchDay
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button and action */}
          <div className="flex items-center space-x-4">
            {/* Authentication Controls */}
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.profile?.display_name || user.email}
                  </span>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <div className="flex items-center space-x-1">
                {navItems.slice(1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};