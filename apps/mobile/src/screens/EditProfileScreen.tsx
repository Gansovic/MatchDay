import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useProfileAvatarUpload } from '../hooks/useProfileAvatarUpload';
import { ProfileAvatarUploader } from '../components/profile/ProfileAvatarUploader';
import { useDashboardData } from '../hooks/useDashboardData';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useDashboardData(user?.id);
  const { updateProfile, isLoading: isUpdating, error: updateError } = useUpdateProfile();
  const {
    pickAndUploadAvatar,
    isLoading: isUploading,
    error: uploadError,
  } = useProfileAvatarUpload();

  const [displayName, setDisplayName] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  // Load profile data when it's available
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile]);

  // Configure header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Profile',
      headerStyle: {
        backgroundColor: '#0a0a0a',
      },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    }

    if (fullName && fullName.length > 100) {
      newErrors.fullName = 'Full name must be 100 characters or less';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }

    if (!validateForm()) {
      return;
    }

    console.log('EditProfile - Submitting profile update:', {
      display_name: displayName.trim(),
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
    });

    const success = await updateProfile(user.id, {
      display_name: displayName.trim(),
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
    });

    console.log('EditProfile - Update success:', success);

    if (success) {
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else if (updateError) {
      console.log('EditProfile - Update error:', updateError);
      Alert.alert('Error', updateError);
    }
  };

  const handleAvatarUpload = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload an avatar');
      return;
    }

    console.log('EditProfile - Starting avatar upload for user:', user.id);
    const result = await pickAndUploadAvatar(user.id);
    console.log('EditProfile - Upload result:', result);

    if (result) {
      console.log('EditProfile - Setting avatar URL:', result.url);
      setAvatarUrl(result.url);
      Alert.alert('Success', 'Profile picture updated!');
    } else if (uploadError) {
      console.log('EditProfile - Upload error:', uploadError);
      Alert.alert('Error', uploadError);
    }
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Uploader */}
        <ProfileAvatarUploader
          currentAvatarUrl={avatarUrl}
          displayName={displayName || 'User'}
          isLoading={isUploading}
          onUploadPress={handleAvatarUpload}
        />

        {/* Display Name */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Display Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              clearFieldError('displayName');
            }}
            placeholder="Enter display name"
            placeholderTextColor="#666"
            maxLength={50}
          />
          {errors.displayName && (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          )}
        </View>

        {/* Full Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              clearFieldError('fullName');
            }}
            placeholder="Enter full name (optional)"
            placeholderTextColor="#666"
            maxLength={100}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.textArea, errors.bio && styles.inputError]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              clearFieldError('bio');
            }}
            placeholder="Tell us about yourself (optional)"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
          {errors.bio && (
            <Text style={styles.errorText}>{errors.bio}</Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {updateError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{updateError}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 12,
  },
});
