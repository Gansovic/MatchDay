import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ColorPicker } from './ColorPicker';
import { TeamLogoUploader } from './TeamLogoUploader';

export interface TeamFormData {
  name: string;
  team_color: string;
  team_bio: string;
  max_players: number;
  min_players: number;
}

interface TeamFormProps {
  initialValues?: Partial<TeamFormData>;
  logoUrl?: string | null;
  onSubmit: (data: TeamFormData) => void;
  onLogoUpload: () => void;
  isLoading?: boolean;
  isLogoUploading?: boolean;
  submitLabel?: string;
  error?: string | null;
}

const DEFAULT_VALUES: TeamFormData = {
  name: '',
  team_color: '#3b82f6',
  team_bio: '',
  max_players: 22,
  min_players: 7,
};

export const TeamForm: React.FC<TeamFormProps> = ({
  initialValues = {},
  logoUrl,
  onSubmit,
  onLogoUpload,
  isLoading = false,
  isLogoUploading = false,
  submitLabel = 'Save',
  error,
}) => {
  const [formData, setFormData] = React.useState<TeamFormData>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const updateField = (field: keyof TeamFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must be at most 50 characters';
    }

    if (formData.min_players < 1 || formData.min_players > 49) {
      errors.min_players = 'Must be between 1 and 49';
    }

    if (formData.max_players < 2 || formData.max_players > 50) {
      errors.max_players = 'Must be between 2 and 50';
    }

    if (formData.max_players <= formData.min_players) {
      errors.max_players = 'Must be greater than minimum';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Logo Upload */}
        <TeamLogoUploader
          currentLogoUrl={logoUrl}
          teamName={formData.name}
          teamColor={formData.team_color}
          isLoading={isLogoUploading}
          onUploadPress={onLogoUpload}
        />

        {/* Team Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Team Name *</Text>
          <TextInput
            style={[styles.input, validationErrors.name && styles.inputError]}
            placeholder="Enter team name"
            placeholderTextColor="#666"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            maxLength={50}
          />
          {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
        </View>

        {/* Color Picker */}
        <ColorPicker
          selectedColor={formData.team_color}
          onColorChange={(color) => updateField('team_color', color)}
        />

        {/* Team Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Team Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell others about your team..."
            placeholderTextColor="#666"
            value={formData.team_bio}
            onChangeText={(text) => updateField('team_bio', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Player Limits */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Min Players</Text>
            <TextInput
              style={[styles.input, validationErrors.min_players && styles.inputError]}
              placeholder="7"
              placeholderTextColor="#666"
              value={String(formData.min_players)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                updateField('min_players', num);
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            {validationErrors.min_players && (
              <Text style={styles.errorText}>{validationErrors.min_players}</Text>
            )}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Max Players</Text>
            <TextInput
              style={[styles.input, validationErrors.max_players && styles.inputError]}
              placeholder="22"
              placeholderTextColor="#666"
              value={String(formData.max_players)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                updateField('max_players', num);
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            {validationErrors.max_players && (
              <Text style={styles.errorText}>{validationErrors.max_players}</Text>
            )}
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
