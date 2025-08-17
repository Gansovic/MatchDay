/**
 * Profile Settings Page
 * 
 * Comprehensive settings page for user profile management, preferences,
 * privacy settings, and account configuration.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Globe,
  Lock,
  Save,
  Edit,
  Camera,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserService } from '@/lib/services/user.service';
import type { UserProfile } from '@/lib/types/database.types';

interface ProfileFormData {
  display_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  location: string;
  preferred_position: string;
  bio: string;
  avatar_url?: string;
}

interface NotificationSettings {
  matchReminders: boolean;
  teamInvitations: boolean;
  leagueUpdates: boolean;
  achievements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface PrivacySettings {
  showStats: boolean;
  showTeams: boolean;
  showAchievements: boolean;
  profileVisibility: 'public' | 'teams-only' | 'private';
}

export default function ProfileSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'account'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileFormData>({
    display_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    location: '',
    preferred_position: '',
    bio: ''
  });

  const [originalProfile, setOriginalProfile] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadUserProfile();
    } else if (!authLoading && !user) {
      setError('Please sign in to view your profile');
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userService = UserService.getInstance();
      const result = await userService.getUserProfile(user.id);
      
      if (result.success && result.data) {
        const profileData: ProfileFormData = {
          display_name: result.data.display_name || '',
          email: user.email || '',
          phone: user.phone || '',
          date_of_birth: result.data.date_of_birth || '',
          location: result.data.location || '',
          preferred_position: result.data.preferred_position || '',
          bio: result.data.bio || '',
          avatar_url: result.data.avatar_url || undefined
        };
        setProfile(profileData);
        setOriginalProfile({ ...profileData });
      } else {
        // Profile doesn't exist, create with user email data
        const defaultProfile: ProfileFormData = {
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phone || '',
          date_of_birth: '',
          location: '',
          preferred_position: '',
          bio: ''
        };
        setProfile(defaultProfile);
        setOriginalProfile({ ...defaultProfile });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const [notifications, setNotifications] = useState<NotificationSettings>({
    matchReminders: true,
    teamInvitations: true,
    leagueUpdates: true,
    achievements: true,
    emailNotifications: true,
    pushNotifications: false
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showStats: true,
    showTeams: true,
    showAchievements: true,
    profileVisibility: 'public'
  });

  const positions = [
    'Goalkeeper', 'Defender', 'Midfielder', 'Forward',
    'Center', 'Guard', 'Point Guard', 'Shooting Guard'
  ];

  const handleProfileSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);
    
    try {
      const userService = UserService.getInstance();
      const result = await userService.updateUserProfile(user.id, {
        display_name: profile.display_name,
        preferred_position: profile.preferred_position,
        bio: profile.bio,
        date_of_birth: profile.date_of_birth,
        location: profile.location,
        avatar_url: profile.avatar_url
      });
      
      if (result.success) {
        setIsEditing(false);
        setSaveMessage('Profile updated successfully!');
        setOriginalProfile({ ...profile });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(result.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile({ ...originalProfile });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: string | boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access your profile settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your account, preferences, and privacy settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'profile' | 'notifications' | 'privacy' | 'account')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {/* Success/Error Messages */}
                  {saveMessage && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-300 text-sm">{saveMessage}</p>
                    </div>
                  )}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Profile Photo */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {profile.display_name.charAt(0) || 'U'}
                      </div>
                      {isEditing && (
                        <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {profile.display_name || 'User'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {profile.preferred_position || 'No position set'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.display_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        title="Email cannot be changed from this page"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Position
                      </label>
                      <select
                        value={profile.preferred_position}
                        onChange={(e) => setProfile(prev => ({ ...prev, preferred_position: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a position</option>
                        {positions.map(position => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleProfileSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Activity Notifications
                      </h3>
                      <div className="space-y-4">
                        {Object.entries({
                          matchReminders: 'Match reminders',
                          teamInvitations: 'Team invitations',
                          leagueUpdates: 'League updates',
                          achievements: 'Achievement unlocks'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <label className="text-gray-700 dark:text-gray-300 font-medium">
                                {label}
                              </label>
                            </div>
                            <button
                              onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notifications[key as keyof NotificationSettings] 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notifications[key as keyof NotificationSettings] 
                                    ? 'translate-x-6' 
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Delivery Methods
                      </h3>
                      <div className="space-y-4">
                        {Object.entries({
                          emailNotifications: 'Email notifications',
                          pushNotifications: 'Push notifications'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <label className="text-gray-700 dark:text-gray-300 font-medium">
                                {label}
                              </label>
                            </div>
                            <button
                              onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notifications[key as keyof NotificationSettings] 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notifications[key as keyof NotificationSettings] 
                                    ? 'translate-x-6' 
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Privacy Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Profile Visibility
                      </h3>
                      <div className="space-y-3">
                        {[
                          { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
                          { value: 'teams-only', label: 'Teams Only', desc: 'Only teammates can view your profile' },
                          { value: 'private', label: 'Private', desc: 'Only you can view your profile' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value={option.value}
                              checked={privacy.profileVisibility === option.value}
                              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-gray-900 dark:text-white font-medium">
                                {option.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {option.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Information Display
                      </h3>
                      <div className="space-y-4">
                        {Object.entries({
                          showStats: 'Show my statistics',
                          showTeams: 'Show my teams',
                          showAchievements: 'Show my achievements'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <label className="text-gray-700 dark:text-gray-300 font-medium">
                              {label}
                            </label>
                            <button
                              onClick={() => handlePrivacyChange(key as keyof PrivacySettings, !privacy[key as keyof PrivacySettings])}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacy[key as keyof PrivacySettings] 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacy[key as keyof PrivacySettings] 
                                    ? 'translate-x-6' 
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Account Settings
                  </h2>

                  <div className="space-y-8">
                    {/* Password Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Password & Security
                      </h3>
                      <div className="space-y-4">
                        <button className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left">
                          <Lock className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Change Password
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Update your account password
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Data Management
                      </h3>
                      <div className="space-y-4">
                        <button className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left">
                          <Globe className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Export Data
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Download your account data
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Danger Zone
                      </h3>
                      <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Delete Account
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Permanently delete your account and all data
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Delete Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}