import { supabase } from '../../../lib/supabase';

/**
 * Get league icon URL from media table
 * @param mediaId - The ID of the media record
 * @returns The storage URL or null if not found
 */
export async function getLeagueIconUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId) return null;

  try {
    const { data, error } = await supabase
      .from('media')
      .select('storage_path')
      .eq('id', mediaId)
      .single();

    if (error) {
      console.error('Error fetching league icon:', error);
      return null;
    }

    return data?.storage_path || null;
  } catch (error) {
    console.error('Error in getLeagueIconUrl:', error);
    return null;
  }
}

/**
 * Get team icon URL from media table
 * @param mediaId - The ID of the media record
 * @returns The storage URL or null if not found
 */
export async function getTeamIconUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId) return null;

  try {
    const { data, error } = await supabase
      .from('media')
      .select('storage_path')
      .eq('id', mediaId)
      .single();

    if (error) {
      console.error('Error fetching team icon:', error);
      return null;
    }

    return data?.storage_path || null;
  } catch (error) {
    console.error('Error in getTeamIconUrl:', error);
    return null;
  }
}

/**
 * Generate a color based on a string (for fallback icons)
 * @param str - The string to generate color from (league/team name)
 * @returns A hex color string
 */
export function generateColorFromString(str: string): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // orange
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // bright orange
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
