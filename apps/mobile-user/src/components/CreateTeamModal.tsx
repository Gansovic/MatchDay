import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// Custom picker using TouchableOpacity instead of external library
import { TeamService, CreateTeamRequest } from '../services/TeamService';
import { LeagueService } from '../services/LeagueService';

interface CreateTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
  userId: string;
}

interface League {
  id: string;
  name: string;
  sport_type: string;
  league_type: string;
  description?: string;
}

const TEAM_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#e11d48' },
  { name: 'Teal', value: '#0891b2' },
  { name: 'Yellow', value: '#ca8a04' },
];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  visible,
  onClose,
  onTeamCreated,
  userId,
}) => {
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    league_id: '',
    description: '',
    team_color: '#2563eb',
    max_players: 15,
    min_players: 7,
  });

  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);

  const teamService = TeamService.getInstance();
  const leagueService = LeagueService.getInstance();

  // Load leagues when modal opens
  useEffect(() => {
    if (visible) {
      loadLeagues();
    }
  }, [visible]);

  const loadLeagues = async () => {
    setLoading(true);
    try {
      const availableLeagues = await teamService.getAvailableLeaguesForTeamCreation();
      setLeagues(availableLeagues);
    } catch (error) {
      console.error('Error loading leagues:', error);
      Alert.alert('Error', 'Failed to load available leagues');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      league_id: '',
      description: '',
      team_color: '#2563eb',
      max_players: 15,
      min_players: 7,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (!formData.league_id) {
      newErrors.league_id = 'Please select a league';
    }

    if (formData.max_players < 5 || formData.max_players > 30) {
      newErrors.max_players = 'Maximum players must be between 5 and 30';
    }

    if (formData.min_players < 3 || formData.min_players > 25) {
      newErrors.min_players = 'Minimum players must be between 3 and 25';
    }

    if (formData.min_players >= formData.max_players) {
      newErrors.min_players = 'Minimum must be less than maximum players';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      const response = await teamService.createTeam(userId, formData);

      if (response.success) {
        Alert.alert(
          'Success!',
          `Team "${formData.name}" has been created successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onTeamCreated();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const ColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.label}>Team Color</Text>
      <View style={styles.colorOptionsContainer}>
        {TEAM_COLORS.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorOption,
              { backgroundColor: color.value },
              formData.team_color === color.value && styles.selectedColorOption,
            ]}
            onPress={() => setFormData({ ...formData, team_color: color.value })}
          >
            {formData.team_color === color.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create New Team</Text>
          <TouchableOpacity
            onPress={handleCreateTeam}
            style={[styles.createButton, creating && styles.disabledButton]}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Team Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Team Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter team name"
              placeholderTextColor="#666"
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* League Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>League *</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading leagues...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.pickerButton, errors.league_id && styles.inputError]}
                  onPress={() => setShowLeaguePicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.league_id && styles.pickerPlaceholder]}>
                    {formData.league_id
                      ? leagues.find(l => l.id === formData.league_id)?.name || 'Unknown League'
                      : 'Select a league'
                    }
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* League Selection Modal */}
                <Modal
                  visible={showLeaguePicker}
                  transparent
                  animationType="slide"
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select League</Text>
                        <TouchableOpacity onPress={() => setShowLeaguePicker(false)}>
                          <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.modalList}>
                        {leagues.map((league) => (
                          <TouchableOpacity
                            key={league.id}
                            style={[
                              styles.modalItem,
                              formData.league_id === league.id && styles.modalItemSelected
                            ]}
                            onPress={() => {
                              setFormData({ ...formData, league_id: league.id });
                              setShowLeaguePicker(false);
                            }}
                          >
                            <Text style={[
                              styles.modalItemText,
                              formData.league_id === league.id && styles.modalItemTextSelected
                            ]}>
                              {league.name}
                            </Text>
                            <Text style={styles.modalItemSubtext}>
                              {league.sport_type} - {league.league_type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              </>
            )}
            {errors.league_id && <Text style={styles.errorText}>{errors.league_id}</Text>}
          </View>

          {/* Team Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Tell people about your team..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Team Color */}
          <ColorPicker />

          {/* Max Players */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Players</Text>
            <TextInput
              style={[styles.input, errors.max_players && styles.inputError]}
              value={formData.max_players.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 15;
                setFormData({ ...formData, max_players: num });
              }}
              placeholder="15"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            {errors.max_players && <Text style={styles.errorText}>{errors.max_players}</Text>}
          </View>

          {/* Min Players */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Players</Text>
            <TextInput
              style={[styles.input, errors.min_players && styles.inputError]}
              value={formData.min_players.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 7;
                setFormData({ ...formData, min_players: num });
              }}
              placeholder="7"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            {errors.min_players && <Text style={styles.errorText}>{errors.min_players}</Text>}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#666',
  },
  pickerArrow: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#2563eb',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 16,
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#374151',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 60,
  },
});