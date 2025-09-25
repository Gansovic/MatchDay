import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { QueryProvider } from '../contexts/QueryProvider';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { MainScreen } from '../screens/MainScreen';
import { MyTeamsScreen } from '../screens/MyTeamsScreen';
import { ExploreLeaguesScreen } from '../screens/ExploreLeaguesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#e5e7eb',
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="MainTab"
          component={MainScreen}
          options={{
            title: 'Main',
            headerTitle: 'MatchDay',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, opacity: color === '#2563eb' ? 1 : 0.6 }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="MyTeamsTab"
          component={MyTeamsScreen}
          options={{
            title: 'My Teams',
            headerTitle: 'My Teams',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, opacity: color === '#2563eb' ? 1 : 0.6 }}>⚽</Text>
            ),
          }}
        />
        <Tab.Screen
          name="ExploreLeaguesTab"
          component={ExploreLeaguesScreen}
          options={{
            title: 'Explore',
            headerTitle: 'Explore Leagues',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, opacity: color === '#2563eb' ? 1 : 0.6 }}>🔍</Text>
            ),
          }}
        />
      </Tab.Navigator>
  );
};

// Auth Navigator for non-authenticated users
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Main Navigator that handles auth state
const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// Main App Navigator with AuthProvider and QueryProvider
export const AppNavigator: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryProvider>
  );
};