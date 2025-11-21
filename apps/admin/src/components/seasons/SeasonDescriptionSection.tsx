'use client';

import React, { useState } from 'react';
import { FileText, Check, X, Loader2 } from 'lucide-react';

interface SeasonDescriptionSectionProps {
  seasonId: string;
  currentDescription: string | null;
  onUpdate?: () => void;
}

export function SeasonDescriptionSection({
  seasonId,
  currentDescription,
  onUpdate
}: SeasonDescriptionSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxLength = 500;
  const remainingChars = maxLength - description.length;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update description');
      }

      setSuccess(true);
      setIsEditing(false);

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating description:', err);
      setError(err instanceof Error ? err.message : 'Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(currentDescription || '');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Season Description
          </h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentDescription ? 'Edit' : 'Add Description'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="season-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="season-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this season... (e.g., 'Summer 2024 Championship League')"
              rows={4}
              maxLength={maxLength}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Describe the season, its format, or any special information
              </p>
              <p className={`text-xs ${remainingChars < 50 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {remainingChars} characters remaining
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          {currentDescription ? (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {currentDescription}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No description set. Add a description to provide more information about this season.
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-900 dark:text-green-100">
            Description updated successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-900 dark:text-red-100">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
