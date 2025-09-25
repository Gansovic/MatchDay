/**
 * Unauthorized Access Page
 * 
 * Displayed when users try to access content they don't have permission for.
 * Provides helpful information about user roles and permissions.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Users, Crown } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { RoleService } from '@/lib/auth/role.service';
import { UserRole } from '@/lib/types/database.types';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      if (user) {
        const role = await RoleService.getCurrentUserRole();
        setUserRole(role);
      }
      setIsLoading(false);
    }

    getUserRole();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this area. 
            {userRole && (
              <>
                <br />
                Your current role is: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {RoleService.getRoleDisplayName(userRole)}
                </span>
              </>
            )}
          </p>

          {/* Role Information */}
          {userRole && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Your Permissions
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {RoleService.getRolePermissions(userRole).map((permission, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Access Info */}
          {userRole && ['player', 'captain', 'admin'].includes(userRole) && (
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Need Admin Access?
                </h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                To access administrative features, you need League Admin or App Admin privileges. 
                Contact your league administrator for more information.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            
            {!user && (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Support */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}