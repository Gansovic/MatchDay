# React Native Mobile App - Media Implementation

## Overview
This document outlines the implementation of match and player media functionality in the React Native mobile app.

## Files Created/Updated

### 1. Type Definitions
**File:** `/Users/lukini/MatchDay/apps/mobile/src/types/media.types.ts`

**Updates:**
- Added `match_id` and `player_id` to `MediaRecord`
- Added `original_media_id` and `is_repost` fields for repost functionality
- Extended `MediaFilters` with `exclude_reposts` and `uploaded_by` filters

### 2. Hooks

#### Created:
1. **`/Users/lukini/MatchDay/apps/mobile/src/hooks/useMediaGallery.ts`**
   - Fetches media with flexible filtering
   - Supports filtering by: team, player, match, league, season, context type, media type
   - Handles repost exclusion
   - Returns signed URLs for media access

2. **`/Users/lukini/MatchDay/apps/mobile/src/hooks/useMediaUpload.ts`**
   - Handles media selection via `expo-image-picker`
   - Supports both images and videos
   - Validates file size (10MB for images, 50MB for videos)
   - Uploads to Supabase storage
   - Creates media records in database
   - Shows upload progress

3. **`/Users/lukini/MatchDay/apps/mobile/src/hooks/useMediaDelete.ts`**
   - Deletes media from storage and database
   - Validates user ownership before deletion
   - Handles cleanup on errors

4. **`/Users/lukini/MatchDay/apps/mobile/src/hooks/useMediaRepost.ts`**
   - Calls the repost API endpoint
   - Checks if media has already been reposted
   - Uses authentication tokens for API calls

**Updated:**
- `/Users/lukini/MatchDay/apps/mobile/src/hooks/index.ts` - Added exports for new hooks

### 3. Components

**Updated:**

1. **`/Users/lukini/MatchDay/apps/mobile/src/components/media/MediaGallery.tsx`**
   - Added `onRepost` and `canRepost` props
   - Passes repost handler to MediaDetailModal
   - Supports repost functionality in gallery view

2. **`/Users/lukini/MatchDay/apps/mobile/src/components/media/MediaGridItem.tsx`**
   - Added repost badge indicator
   - Shows blue "repeat" icon for reposted media
   - Positioned at top-left of media item

3. **`/Users/lukini/MatchDay/apps/mobile/src/components/media/MediaDetailModal.tsx`**
   - Added repost button for non-reposted media
   - Shows "Reposted from original" info for reposts
   - Alert confirmation before reposting
   - Styled with blue theme for repost actions

### 4. Screens

#### Created:

1. **`/Users/lukini/MatchDay/apps/mobile/src/screens/MatchMediaScreen.tsx`**
   - **Purpose:** Display and manage match-specific media
   - **Features:**
     - Admin-only upload capability
     - View all match media (public viewing)
     - Delete functionality for admins
     - Repost functionality for all users
     - Filter by image/video
     - Pull-to-refresh
   - **Props:**
     - `matchId` - Match identifier
     - `matchTitle` - Display title
     - `isAdmin` - Whether user is admin

2. **`/Users/lukini/MatchDay/apps/mobile/src/screens/PlayerMediaScreen.tsx`**
   - **Purpose:** Player profile gallery with upload and repost features
   - **Features:**
     - Three tabs: All, Uploads, Reposts
     - Upload to own gallery (when viewing own profile)
     - Repost from other galleries
     - Delete own media
     - Filter by image/video
     - Pull-to-refresh
   - **Props:**
     - `playerId` - Player identifier
     - `playerName` - Display name
     - `isOwnProfile` - Whether viewing own profile

### 5. Navigation

**Updated:** `/Users/lukini/MatchDay/apps/mobile/src/navigation/AppNavigator.tsx`

Added two new routes:
- `MatchMedia` - Match media screen
- `PlayerMedia` - Player gallery screen

Both screens use the standard header style with dark theme.

## Usage Examples

### Navigate to Match Media
```typescript
navigation.navigate('MatchMedia', {
  matchId: 'match-uuid',
  matchTitle: 'Team A vs Team B',
  isAdmin: true // or false
});
```

### Navigate to Player Media
```typescript
navigation.navigate('PlayerMedia', {
  playerId: 'player-uuid',
  playerName: 'John Doe',
  isOwnProfile: currentUserId === 'player-uuid'
});
```

### Use Media Hooks
```typescript
// Fetch media
const { media, loading, error, refetch } = useMediaGallery({
  match_id: matchId,
  context_type: 'match_media',
  exclude_reposts: false
});

// Upload media
const { pickAndUploadMedia, isLoading } = useMediaUpload();
const result = await pickAndUploadMedia({
  context_type: 'player_media',
  player_id: playerId,
  is_public: true
});

// Delete media
const { deleteMedia, isDeleting } = useMediaDelete();
await deleteMedia(mediaId);

// Repost media
const { repostMedia, isReposting } = useMediaRepost();
const result = await repostMedia(mediaId);
```

## Platform-Specific Considerations

### iOS
- Requires `NSPhotoLibraryUsageDescription` in Info.plist
- Requires `NSCameraUsageDescription` if camera upload is added

### Android
- Requires `READ_EXTERNAL_STORAGE` permission
- Requires `WRITE_EXTERNAL_STORAGE` permission (for Android < 10)

### Both Platforms
- Uses `expo-image-picker` for media selection
- Uses `expo-image` for optimized image rendering
- Uses `expo-av` for video playback
- All media is cached using `expo-image` cache policy

## API Endpoints Used

### Repost Endpoint
- **URL:** `${API_URL}/api/media/{mediaId}/repost`
- **Method:** POST
- **Auth:** Bearer token required
- **Response:** Returns new media record with `is_repost: true`

## Features

### Match Media
- Admin-controlled uploads
- Public viewing for all players
- Repost to personal gallery
- Context: `match_media`
- Associated with specific match ID

### Player Media
- Upload to own gallery
- Three-tab interface:
  - **All:** Shows all media (uploads + reposts)
  - **Uploads:** Shows only original uploads
  - **Reposts:** Shows only reposted media
- Repost from other players
- Delete own media only
- Context: `player_media`
- Associated with specific player ID

### Media Types
- **Images:** Max 10MB, allows editing before upload
- **Videos:** Max 50MB, max 60 seconds duration
- Filtered by type (image/video)

### Repost Functionality
- Creates duplicate media record
- Sets `is_repost: true`
- Sets `original_media_id` to source media
- Copies storage path (no file duplication)
- Visual indicator (blue repeat icon)
- Cannot repost already reposted media

## Styling

All components follow the app's dark theme:
- Background: `#0a0a0a` (dark black)
- Cards: `#1a1a1a` (lighter black)
- Borders: `#333` (dark gray)
- Primary: `#3b82f6` (blue)
- Text: `#fff` (white)
- Secondary text: `#999` (gray)
- Success: `#22c55e` (green)
- Error: `#ef4444` (red)

## Next Steps

### Potential Enhancements
1. Add camera capture option (in addition to gallery)
2. Add image editing/cropping for all media types
3. Add video trimming functionality
4. Add media comments/reactions
5. Add share to social media
6. Add media tagging of players
7. Add media search/filter by tags
8. Add media analytics (views, reposts count)

### Integration Points
To integrate these screens into your app:

1. **From Match Details:**
   ```typescript
   <TouchableOpacity onPress={() =>
     navigation.navigate('MatchMedia', {
       matchId: match.id,
       matchTitle: `${match.home_team.name} vs ${match.away_team.name}`,
       isAdmin: user.role === 'admin'
     })
   }>
     <Text>View Match Media</Text>
   </TouchableOpacity>
   ```

2. **From Profile/Dashboard:**
   ```typescript
   <TouchableOpacity onPress={() =>
     navigation.navigate('PlayerMedia', {
       playerId: user.id,
       playerName: user.display_name,
       isOwnProfile: true
     })
   }>
     <Text>My Gallery</Text>
   </TouchableOpacity>
   ```

3. **From Player Profile View:**
   ```typescript
   <TouchableOpacity onPress={() =>
     navigation.navigate('PlayerMedia', {
       playerId: player.id,
       playerName: player.display_name,
       isOwnProfile: player.id === currentUser.id
     })
   }>
     <Text>View Gallery</Text>
   </TouchableOpacity>
   ```

## Testing Checklist

- [ ] Upload image to match (as admin)
- [ ] Upload video to match (as admin)
- [ ] Upload media to own player gallery
- [ ] Repost match media to player gallery
- [ ] Repost another player's media
- [ ] Delete own media
- [ ] Attempt to delete other's media (should fail)
- [ ] Filter by image type
- [ ] Filter by video type
- [ ] Switch between tabs (All/Uploads/Reposts)
- [ ] Pull-to-refresh on all screens
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test with slow network
- [ ] Test file size validation
- [ ] Test permissions handling

## Issues Encountered

None during implementation. All components follow existing patterns and integrate smoothly with the current codebase.

## Dependencies

All required dependencies are already installed:
- `expo-image-picker` - Media selection
- `expo-image` - Optimized image rendering
- `expo-av` - Video playback
- `@expo/vector-icons` - Icons
- `@supabase/supabase-js` - Backend integration
