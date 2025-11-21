# PlayerMediaTab Component - Usage Example

## Overview
The `PlayerMediaTab` component provides a comprehensive media management interface for players, supporting both personal uploads and reposts from match/team media.

## Basic Usage

```tsx
import { PlayerMediaTab } from '@/components/media/player-media-tab';

// In a player profile page
export default function PlayerProfilePage({ params }: { params: { playerId: string } }) {
  const { playerId } = params;
  const currentUserId = '...'; // Get from auth

  return (
    <div>
      <PlayerMediaTab
        playerId={playerId}
        playerName="John Doe"
        isOwnProfile={playerId === currentUserId}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `playerId` | `string` | Yes | - | The ID of the player whose media to display |
| `playerName` | `string` | No | `'Player'` | The name of the player for display purposes |
| `isOwnProfile` | `boolean` | No | `false` | Whether the current user is viewing their own profile |

## Features

### 1. Media Upload
- Only available when `isOwnProfile={true}`
- Supports images (JPEG, PNG, WebP, GIF) up to 10MB
- Supports videos (MP4, MOV, WebM) up to 100MB
- Image cropping with 16:9 aspect ratio
- Automatic upload to player's personal media gallery

### 2. Filter Tabs
Three filter options:
- **All** - Shows all media (uploads + reposts)
- **My Uploads** - Shows only personally uploaded media
- **Reposts** - Shows only reposted media from matches/teams

### 3. Media Gallery
- Grid layout with hover effects
- Full-screen modal view
- Download functionality
- Repost button (only for non-reposted items)
- Delete button (only for own media)
- Visual badges:
  - Repost badge (blue Repeat2 icon)
  - Privacy badge (green Globe for public, orange Lock for private)

### 4. Repost Functionality
Players can repost media from:
- Match media galleries
- Team media galleries
- Season media galleries

The repost creates a reference to the original media without duplicating the file.

## API Endpoints

### GET `/api/players/[playerId]/media`
Fetches all media for a player (uploads + reposts).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "url": "https://...",
      "media_type": "image",
      "is_repost": false,
      "is_public": true,
      "description": "...",
      "tags": ["personal"],
      "created_at": "2025-11-20T00:00:00Z",
      // ... other fields
    }
  ]
}
```

### POST `/api/players/[playerId]/media`
Upload personal media for a player.

**Request (FormData):**
- `file` - The media file
- `description` (optional) - Media description
- `tags` (optional) - JSON array of tags
- `is_public` (optional) - Boolean, defaults to true

**Response:**
```json
{
  "data": {
    "media": { /* MediaWithUrl object */ },
    // ... upload result
  }
}
```

### POST `/api/media/[mediaId]/repost`
Repost existing media to player's gallery.

**Response:**
```json
{
  "data": { /* MediaWithUrl object with is_repost: true */ },
  "message": "Media reposted successfully"
}
```

## Integration with MediaGallery

The `MediaGallery` component was enhanced to support reposting:

```tsx
<MediaGallery
  media={filteredMedia}
  onDelete={isOwnProfile ? handleDelete : undefined}
  onRepost={isOwnProfile ? handleRepost : undefined}
  canDelete={isOwnProfile}
  canRepost={isOwnProfile}
  emptyMessage="Custom empty state message"
/>
```

### New MediaGallery Props:
- `onRepost?: (mediaId: string) => void` - Callback for repost action
- `canRepost?: boolean` - Whether to show repost button

## Styling

The component uses Tailwind CSS with dark mode support:
- Blue color scheme for active states
- Green for repost actions
- Red for delete actions
- Responsive grid layout (2/3/4 columns)
- Smooth transitions and hover effects

## Error Handling

The component includes comprehensive error handling:
- Upload errors
- Fetch errors
- Delete errors
- Repost errors

Errors are displayed in a dismissible red alert box with clear messaging.

## Example: Full Player Profile Page

```tsx
'use client';

import { PlayerMediaTab } from '@/components/media/player-media-tab';
import { useAuth } from '@/hooks/use-auth';

export default function PlayerProfilePage({
  params
}: {
  params: { playerId: string }
}) {
  const { user } = useAuth();
  const { playerId } = params;
  const isOwnProfile = user?.id === playerId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Player Profile</h1>
      </div>

      <div className="grid gap-6">
        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          {/* Player stats here */}
        </div>

        {/* Media Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <PlayerMediaTab
            playerId={playerId}
            playerName={user?.full_name || 'Player'}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
    </div>
  );
}
```

## Notes

- The component automatically handles image cropping for uploaded images
- Videos are uploaded directly without cropping
- Repost button only appears for media that hasn't been reposted yet
- All media operations require authentication
- Only the player can upload to their own profile (enforced by API)
