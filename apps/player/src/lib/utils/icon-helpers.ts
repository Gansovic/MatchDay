/**
 * Icon Helper Utilities
 *
 * Helper functions for fetching and displaying league and season icons
 * with automatic fallback logic
 */

import { MediaWithUrl } from '@matchday/database';

/**
 * Fetch league icon from the API
 */
export async function getLeagueIcon(leagueId: string): Promise<MediaWithUrl | null> {
  try {
    const response = await fetch(`/api/media/league/${leagueId}/icon`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch league icon');
    }

    const data = await response.json();
    return data.icon || null;
  } catch (error) {
    console.error('Error fetching league icon:', error);
    return null;
  }
}

/**
 * Fetch season icon with automatic fallback to league icon
 */
export async function getSeasonIcon(seasonId: string, leagueId: string): Promise<MediaWithUrl | null> {
  try {
    const response = await fetch(`/api/media/season/${seasonId}/icon?leagueId=${leagueId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch season icon');
    }

    const data = await response.json();
    return data.icon || null;
  } catch (error) {
    console.error('Error fetching season icon:', error);
    return null;
  }
}

/**
 * Get icon URL for a league
 */
export async function getLeagueIconUrl(leagueId: string): Promise<string | null> {
  const icon = await getLeagueIcon(leagueId);
  return icon?.url || null;
}

/**
 * Get icon URL for a season (with automatic fallback to league icon)
 */
export async function getSeasonIconUrl(seasonId: string, leagueId: string): Promise<string | null> {
  const icon = await getSeasonIcon(seasonId, leagueId);
  return icon?.url || null;
}

/**
 * Delete league icon
 */
export async function deleteLeagueIcon(leagueId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/media/league/${leagueId}/icon`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete league icon');
    }

    return true;
  } catch (error) {
    console.error('Error deleting league icon:', error);
    return false;
  }
}

/**
 * Delete season icon
 */
export async function deleteSeasonIcon(seasonId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/media/season/${seasonId}/icon`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete season icon');
    }

    return true;
  } catch (error) {
    console.error('Error deleting season icon:', error);
    return false;
  }
}
