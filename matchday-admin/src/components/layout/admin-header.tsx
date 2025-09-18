/**
 * Admin Header Component
 * 
 * Navigation header for league administrators with admin-specific features
 * and professional administrative interface.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface AdminHeaderProps {
  className?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  // Admin app navigation - focused on league management
  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/leagues', label: 'Leagues', icon: '🏆' },
    { href: '/matches', label: 'Matches', icon: '⚽' },
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
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`bg-card/80 backdrop-blur-sm border-b border-border/50 shadow-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              MatchDay Admin
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:scale-105 ${
                  isActive(item.href)
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              <div className="animate-pulse bg-gray-700 h-8 w-20 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {user.profile?.display_name || user.email}
                  </span>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 rounded-full font-medium">
                    Admin
                  </span>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <div className="flex items-center space-x-1">
                {navItems.slice(1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      isActive(item.href)
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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