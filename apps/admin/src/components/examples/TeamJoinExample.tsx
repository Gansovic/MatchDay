/**
 * Example Component: Team Join Form
 * 
 * This example shows how to use multiple custom hooks together
 * to create a clean, maintainable component for joining teams
 */

'use client';

import React from 'react';
import { useTeam, useJoinTeam, useForm, useToggle, useUserProfile } from '@/hooks';

interface TeamJoinFormProps {
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamJoinExample({ teamId, onSuccess, onCancel }: TeamJoinFormProps) {
  // Use custom hooks for data and state management
  const { data: team, loading: teamLoading } = useTeam(teamId);
  const { data: userProfile } = useUserProfile();
  const { execute: joinTeam, loading: joining, error: joinError } = useJoinTeam();
  const [showPositionHelp, togglePositionHelp] = useToggle(false);

  // Use form hook for form state management
  const {
    values,
    errors,
    getFieldProps,
    handleSubmit,
    isValid
  } = useForm({
    initialValues: {
      position: userProfile?.preferred_position || '',
      message: ''
    },
    validationRules: {
      position: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      message: {
        maxLength: 200
      }
    },
    onSubmit: async (formValues) => {
      try {
        await joinTeam(teamId, formValues.position);
        onSuccess?.();
      } catch (error) {
        // Error is already handled by the useJoinTeam hook
      }
    }
  });

  if (teamLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading team details...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 text-center text-red-600">
        Team not found
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Join {team.name}
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>League:</strong> {team.league?.name || 'Independent'}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Sport:</strong> {team.sport_type}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Type:</strong> {team.team_type}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Position *
            <button
              type="button"
              onClick={togglePositionHelp}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ?
            </button>
          </label>
          
          {showPositionHelp && (
            <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
              Enter your preferred playing position (e.g., Forward, Midfielder, Goalkeeper, etc.)
            </div>
          )}
          
          <input
            {...getFieldProps('position')}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.position ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Forward, Midfielder"
          />
          
          {errors.position && (
            <p className="mt-1 text-sm text-red-600">{errors.position}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Team (Optional)
          </label>
          <textarea
            {...getFieldProps('message')}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tell the team about yourself..."
          />
          
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message}</p>
          )}
        </div>

        {joinError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{joinError.message}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isValid || joining}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              isValid && !joining
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {joining ? 'Joining...' : 'Join Team'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}