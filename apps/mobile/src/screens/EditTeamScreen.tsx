import React from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateTeam } from '../hooks/useUpdateTeam';
import { useDeleteTeam } from '../hooks/useDeleteTeam';
import { useTeamLogoUpload } from '../hooks/useTeamLogoUpload';
import { useTeamData } from '../hooks/useTeamData';
import { TeamForm, TeamFormData } from '../components/team/TeamForm';
import { DeleteTeamConfirmation } from '../components/team/DeleteTeamConfirmation';

export const EditTeamScreen = ({ route, navigation }: any) => {
  const { teamId } = route.params;
  const { user } = useAuth();
  const { team, loading: teamLoading, error: teamError } = useTeamData(teamId, user?.id);
  const { updateTeam, isLoading: isUpdating, error: updateError } = useUpdateTeam();
  const { deleteTeam, isLoading: isDeleting, error: deleteError } = useDeleteTeam();
  const {
    pickAndUploadLogo,
    isLoading: isUploading,
    error: uploadError,
  } = useTeamLogoUpload();

  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  // Set initial logo URL when team data loads
  React.useEffect(() => {
    if (team?.logo_url) {
      setLogoUrl(team.logo_url);
    }
  }, [team?.logo_url]);

  const handleSubmit = async (data: TeamFormData) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit a team');
      return;
    }

    const success = await updateTeam(teamId, data, user.id);
    if (success) {
      Alert.alert('Success', 'Team updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const handleLogoUpload = async () => {
    const result = await pickAndUploadLogo(teamId);
    if (result) {
      setLogoUrl(result.url);
      Alert.alert('Success', 'Team logo updated successfully!');
    } else if (uploadError) {
      Alert.alert('Error', uploadError);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete a team');
      return;
    }

    const success = await deleteTeam(teamId, user.id);
    if (success) {
      Alert.alert('Deleted', 'Team has been deleted', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to teams list
            navigation.navigate('MyTeams');
          },
        },
      ]);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Team Settings',
      headerStyle: {
        backgroundColor: '#0a0a0a',
      },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  if (teamLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (teamError || !team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{teamError || 'Team not found'}</Text>
      </View>
    );
  }

  const initialValues: Partial<TeamFormData> = {
    name: team.name,
    team_color: team.team_color || '#3b82f6',
    team_bio: '', // We don't have team_bio in TeamDetails, would need to fetch separately
    max_players: 22, // Default, would need to fetch from team data
    min_players: 7, // Default, would need to fetch from team data
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TeamForm
        initialValues={initialValues}
        logoUrl={logoUrl}
        onSubmit={handleSubmit}
        onLogoUpload={handleLogoUpload}
        isLoading={isUpdating}
        isLogoUploading={isUploading}
        submitLabel="Save Changes"
        error={updateError || uploadError || deleteError}
      />

      {/* Delete Section */}
      <View style={styles.deleteSection}>
        <DeleteTeamConfirmation
          teamName={team.name}
          onDelete={handleDelete}
          isLoading={isDeleting}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  deleteSection: {
    padding: 20,
    paddingTop: 0,
  },
});
