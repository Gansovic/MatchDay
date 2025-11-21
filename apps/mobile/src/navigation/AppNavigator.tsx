import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MyTeamsScreen } from '../screens/MyTeamsScreen';
import { TeamDetailsScreen } from '../screens/TeamDetailsScreen';
import { LeaguesScreen } from '../screens/LeaguesScreen';
import { LeagueDetailsScreen } from '../screens/LeagueDetailsScreen';
import { SeasonDetailsScreen } from '../screens/SeasonDetailsScreen';
import { CreateTeamScreen } from '../screens/CreateTeamScreen';
import { EditTeamScreen } from '../screens/EditTeamScreen';
import { JoinTeamScreen} from '../screens/JoinTeamScreen';
import { MatchDetailsScreen } from '../screens/MatchDetailsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AllMatchesScreen } from '../screens/AllMatchesScreen';
import { MatchMediaScreen } from '../screens/MatchMediaScreen';
import { PlayerMediaScreen } from '../screens/PlayerMediaScreen';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const prefix = Linking.createURL('/');

const linking: LinkingOptions<any> = {
  prefixes: [prefix, 'matchday://'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Leagues: 'leagues',
          MyTeams: 'teams',
        },
      },
      TeamDetails: 'team/:teamId',
      LeagueDetails: 'league/:leagueId',
      SeasonDetails: 'season/:seasonId',
      MatchDetails: 'match/:matchId',
      JoinTeam: 'join/:code',
    },
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 24,
          height: 80,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Leagues"
        component={LeaguesScreen}
        options={{
          tabBarLabel: 'Leagues',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 12 }} />
          ),
        }}
      />
      <Tab.Screen
        name="MyTeams"
        component={MyTeamsScreen}
        options={{
          tabBarLabel: 'My Teams',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: color }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  console.log('AppNavigator - loading:', loading, 'user:', user);

  if (loading === true) {
    console.log('Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isAuthenticated = user !== null && user !== undefined;
  console.log('isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
            />
            <Stack.Screen
              name="TeamDetails"
              component={TeamDetailsScreen}
              options={{
                headerShown: true,
                title: 'Team',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="LeagueDetails"
              component={LeagueDetailsScreen}
              options={{
                headerShown: true,
                title: 'League',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="SeasonDetails"
              component={SeasonDetailsScreen}
              options={{
                headerShown: true,
                title: 'Season',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="MatchDetails"
              component={MatchDetailsScreen}
              options={{
                headerShown: true,
                title: 'Match Details',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="JoinTeam"
              component={JoinTeamScreen}
              options={{
                headerShown: true,
                title: 'Join Team',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: true,
                title: 'Edit Profile',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="AllMatches"
              component={AllMatchesScreen}
              options={{
                headerShown: true,
                title: 'All Matches',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="CreateTeam"
              component={CreateTeamScreen}
              options={{
                headerShown: true,
                title: 'Create Team',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="EditTeam"
              component={EditTeamScreen}
              options={{
                headerShown: true,
                title: 'Team Settings',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="MatchMedia"
              component={MatchMediaScreen}
              options={{
                headerShown: true,
                title: 'Match Media',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="PlayerMedia"
              component={PlayerMediaScreen}
              options={{
                headerShown: true,
                title: 'Gallery',
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
