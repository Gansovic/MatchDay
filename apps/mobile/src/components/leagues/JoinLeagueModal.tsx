import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LeagueData } from '../../hooks/useLeaguesData';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface JoinLeagueModalProps {
  visible: boolean;
  league: LeagueData | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserTeam {
  id: string;
  name: string;
}

type JoinMode = 'existing' | 'new';

export const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({
  visible,
  league,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joinMode, setJoinMode] = useState<JoinMode>('existing');
  const [availableTeams, setAvailableTeams] = useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Fetch user's available teams when modal opens
  useEffect(() => {
    const fetchAvailableTeams = async () => {
      if (!visible || !user || !league) return;

      setLoadingTeams(true);
      try {
        console.log('🔍 Fetching available teams for user:', user.id);

        // Get user's teams (all teams they're a member of)
        const { data: teamMembersData, error: teamMembersError } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name, captain_id)')
          .eq('user_id', user.id)
          .is('removed_at', null); // Only get teams where user hasn't been removed

        if (teamMembersError) throw teamMembersError;

        console.log('👥 Found team memberships:', teamMembersData?.length || 0);

        // Filter for teams where user is captain (has permission to join leagues)
        const userTeams = teamMembersData?.filter((tm: any) => {
          return tm.teams?.captain_id === user.id;
        }) || [];

        console.log('👑 Teams where user is captain:', userTeams.length);

        if (userTeams.length === 0) {
          console.log('ℹ️ User has no teams where they are captain, defaulting to create new team mode');
          setAvailableTeams([]);
          setJoinMode('new');
          return;
        }

        const userTeamIds = userTeams.map((tm: any) => tm.team_id);

        // Get active season for the league
        const { data: activeSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('id')
          .eq('league_id', league.id)
          .eq('is_active', true)
          .single();

        if (seasonError && seasonError.code !== 'PGRST116') {
          throw seasonError;
        }

        let teamsInSeason: string[] = [];
        if (activeSeason) {
          // Get teams already in this season
          const { data: seasonTeamsData } = await supabase
            .from('season_teams')
            .select('team_id')
            .eq('season_id', activeSeason.id);

          teamsInSeason = seasonTeamsData?.map((st) => st.team_id) || [];
          console.log('🏆 Teams already in season:', teamsInSeason.length);
        }

        // Filter out teams already in the active season
        const availableTeamsData = userTeams
          .filter((tm: any) => !teamsInSeason.includes(tm.team_id))
          .map((tm: any) => ({
            id: tm.teams.id,
            name: tm.teams.name,
          }));

        console.log('✅ Available teams:', availableTeamsData.length);
        setAvailableTeams(availableTeamsData);

        // Default to first available team or new team mode
        if (availableTeamsData.length > 0) {
          setSelectedTeamId(availableTeamsData[0].id);
          setJoinMode('existing');
        } else {
          console.log('ℹ️ All teams already in season, defaulting to create new team mode');
          setJoinMode('new');
        }
      } catch (err) {
        console.error('❌ Error fetching available teams:', err);
        setJoinMode('new');
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchAvailableTeams();
  }, [visible, user, league]);

  const handleJoin = async () => {
    console.log('🚀 Starting handleJoin');
    console.log('League:', league?.id);
    console.log('User:', user?.id);
    console.log('Join mode:', joinMode);

    if (!league || !user) {
      console.log('❌ Missing league or user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let teamId: string;

      if (joinMode === 'existing') {
        // Use selected existing team
        console.log('📋 Selected team ID:', selectedTeamId);
        if (!selectedTeamId) {
          console.log('❌ No team selected');
          setError('Please select a team');
          setLoading(false);
          return;
        }
        teamId = selectedTeamId;
        console.log('🔄 Joining with existing team:', teamId);
      } else {
        // Create new team
        console.log('📝 Team name:', teamName);
        if (!teamName.trim()) {
          console.log('❌ No team name provided');
          setError('Please enter a team name');
          setLoading(false);
          return;
        }

        console.log('➕ Creating new team:', teamName);

        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: teamName.trim(),
            captain_id: user.id,
          })
          .select()
          .single();

        console.log('Team creation response:', { teamData, teamError });

        if (teamError) {
          console.error('❌ Team creation error:', teamError);
          throw teamError;
        }

        // Add user as team member
        console.log('➕ Adding user as team member');
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamData.id,
            user_id: user.id,
          });

        console.log('Member addition response:', { memberError });

        if (memberError) {
          console.error('❌ Member addition error:', memberError);
          throw memberError;
        }

        teamId = teamData.id;
        console.log('✅ Created new team:', teamId);
      }

      // Update team to be associated with the league
      console.log('🔗 Associating team with league:', { teamId, leagueId: league.id });
      const { error: teamUpdateError } = await supabase
        .from('teams')
        .update({ league_id: league.id })
        .eq('id', teamId);

      console.log('Team league association response:', { teamUpdateError });

      if (teamUpdateError) {
        console.error('❌ Team league association error:', teamUpdateError);
        throw teamUpdateError;
      }

      // Get the active season for this league
      console.log('🔍 Looking for active season for league:', league.id);
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('league_id', league.id)
        .eq('is_active', true)
        .single();

      console.log('Season query response:', { seasonData, seasonError });

      if (seasonError && seasonError.code !== 'PGRST116') {
        console.error('❌ Season query error:', seasonError);
        throw seasonError;
      }

      if (!seasonData) {
        console.log('⚠️ No active season found for league:', league.id);
        Alert.alert(
          'No Active Season',
          'This league does not have an active season yet. Your team has been prepared but not added to a season.',
          [
            {
              text: 'OK',
              onPress: () => {
                setTeamName('');
                setSelectedTeamId(null);
                onSuccess();
                onClose();
              },
            },
          ]
        );
        return;
      }

      // Create a join request instead of directly adding to season
      console.log('📝 Creating join request for season:', { seasonId: seasonData.id, teamId });
      const { error: joinRequestError } = await supabase
        .from('season_join_requests')
        .insert({
          season_id: seasonData.id,
          team_id: teamId,
          user_id: user.id,
          status: 'pending',
          message: null, // Could add an optional message field in the UI later
        });

      console.log('Join request response:', { joinRequestError });

      if (joinRequestError) {
        console.error('❌ Join request error:', joinRequestError);
        throw joinRequestError;
      }

      const teamDisplayName = joinMode === 'existing'
        ? availableTeams.find((t) => t.id === teamId)?.name
        : teamName;

      Alert.alert(
        'Request Sent!',
        `Your request to join ${league.name} with team "${teamDisplayName}" has been sent to the league admin for approval.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setTeamName('');
              setSelectedTeamId(null);
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err) {
      console.error('❌ Error joining league:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));

      // Extract more detailed error information
      let errorMessage = 'Failed to join league';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // @ts-ignore - accessing error object properties
        errorMessage = err.message || err.error_description || JSON.stringify(err);
      }

      console.error('❌ Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setSelectedTeamId(null);
    setError(null);
    onClose();
  };

  if (!league) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Request to Join</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* League Info */}
            <View style={styles.leagueInfo}>
              <Text style={styles.leagueName}>{league.name}</Text>
              {league.description && (
                <Text style={styles.leagueDescription}>{league.description}</Text>
              )}
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaText}>{league.sport_type}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaText}>{league.league_type}</Text>
                </View>
              </View>
            </View>

            {/* Loading Teams */}
            {loadingTeams ? (
              <View style={styles.loadingTeamsContainer}>
                <ActivityIndicator color="#3b82f6" />
                <Text style={styles.loadingTeamsText}>Loading your teams...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollableContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Mode Toggle - Only show if user has available teams */}
                {availableTeams.length > 0 && (
                  <View style={styles.modeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        joinMode === 'existing' && styles.modeButtonActive,
                      ]}
                      onPress={() => setJoinMode('existing')}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          joinMode === 'existing' && styles.modeButtonTextActive,
                        ]}
                      >
                        Existing Team
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        joinMode === 'new' && styles.modeButtonActive,
                      ]}
                      onPress={() => setJoinMode('new')}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          joinMode === 'new' && styles.modeButtonTextActive,
                        ]}
                      >
                        Create New Team
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Existing Team Selection */}
                {joinMode === 'existing' && availableTeams.length > 0 && (
                  <View style={styles.inputSection}>
                    <Text style={styles.label}>Select Team</Text>
                    <View style={styles.teamList}>
                      {availableTeams.map((team) => (
                        <TouchableOpacity
                          key={team.id}
                          style={[
                            styles.teamOption,
                            selectedTeamId === team.id && styles.teamOptionSelected,
                          ]}
                          onPress={() => setSelectedTeamId(team.id)}
                          disabled={loading}
                        >
                          <View
                            style={[
                              styles.teamRadio,
                              selectedTeamId === team.id && styles.teamRadioSelected,
                            ]}
                          >
                            {selectedTeamId === team.id && (
                              <View style={styles.teamRadioInner} />
                            )}
                          </View>
                          <Text style={styles.teamOptionText}>{team.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* New Team Creation */}
                {joinMode === 'new' && (
                  <View style={styles.inputSection}>
                    <Text style={styles.label}>Team Name</Text>
                    <TextInput
                      style={styles.input}
                      value={teamName}
                      onChangeText={setTeamName}
                      placeholder="Enter your team name"
                      placeholderTextColor="#666"
                      editable={!loading}
                    />
                  </View>
                )}

                {/* Error Message */}
                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Info Text */}
                <Text style={styles.infoText}>
                  {joinMode === 'existing'
                    ? 'Your selected team will join this league. Team members will be able to participate in matches.'
                    : "You'll create a new team to participate in this league. You can add players to your team later."}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.joinButton, loading && styles.buttonDisabled]}
                    onPress={handleJoin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.joinButtonText}>Send Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    paddingHorizontal: 16,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    padding: 20,
    maxHeight: '100%',
  },
  scrollableContent: {
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#999',
  },
  leagueInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  leagueDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  loadingTeamsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingTeamsText: {
    fontSize: 13,
    color: '#999',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  teamList: {
    gap: 8,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    gap: 10,
  },
  teamOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  teamRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamRadioSelected: {
    borderColor: '#3b82f6',
  },
  teamRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  teamOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
