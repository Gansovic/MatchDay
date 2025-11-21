import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCreateTeam } from '../hooks/useCreateTeam';
import { useTeamLogoUpload } from '../hooks/useTeamLogoUpload';
import { TeamForm, TeamFormData } from '../components/team/TeamForm';

export const CreateTeamScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { createTeam, isLoading: isCreating, error: createError } = useCreateTeam();
  const {
    pickAndUploadLogo,
    isLoading: isUploading,
    error: uploadError,
  } = useTeamLogoUpload();

  const [createdTeamId, setCreatedTeamId] = React.useState<string | null>(null);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  const handleSubmit = async (data: TeamFormData) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a team');
      return;
    }

    const result = await createTeam(data, user.id);
    if (result) {
      setCreatedTeamId(result.id);
      Alert.alert('Success', `Team "${result.name}" created successfully!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const handleLogoUpload = async () => {
    if (!createdTeamId) {
      Alert.alert('Info', 'Create the team first, then you can upload a logo');
      return;
    }

    const result = await pickAndUploadLogo(createdTeamId);
    if (result) {
      setLogoUrl(result.url);
      Alert.alert('Success', 'Team logo uploaded successfully!');
    } else if (uploadError) {
      Alert.alert('Error', uploadError);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Create Team',
      headerStyle: {
        backgroundColor: '#0a0a0a',
      },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TeamForm
        onSubmit={handleSubmit}
        onLogoUpload={handleLogoUpload}
        isLoading={isCreating}
        isLogoUploading={isUploading}
        submitLabel="Create Team"
        error={createError || uploadError}
        logoUrl={logoUrl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
