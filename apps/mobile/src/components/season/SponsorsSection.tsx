import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

interface Props {
  sponsors: Sponsor[];
}

export const SponsorsSection: React.FC<Props> = ({ sponsors }) => {
  const handleSponsorPress = async (sponsor: Sponsor) => {
    if (!sponsor.website_url) return;

    try {
      const canOpen = await Linking.canOpenURL(sponsor.website_url);
      if (canOpen) {
        await Linking.openURL(sponsor.website_url);
      } else {
        Alert.alert('Error', 'Unable to open sponsor website');
      }
    } catch (error) {
      console.error('Failed to open sponsor link:', error);
      Alert.alert('Error', 'Failed to open sponsor website');
    }
  };

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="award" size={18} color="#9ca3af" />
        <Text style={styles.title}>Our Sponsors</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sponsorsContainer}
      >
        {sponsors.map((sponsor) => (
          <TouchableOpacity
            key={sponsor.id}
            style={styles.sponsorCard}
            onPress={() => handleSponsorPress(sponsor)}
            disabled={!sponsor.website_url}
            activeOpacity={sponsor.website_url ? 0.7 : 1}
          >
            {sponsor.logo_url ? (
              <Image
                source={{ uri: sponsor.logo_url }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderLogo}>
                <Feather name="image" size={24} color="#6b7280" />
              </View>
            )}
            <Text style={styles.sponsorName} numberOfLines={1}>
              {sponsor.name}
            </Text>
            {sponsor.website_url && (
              <View style={styles.linkIndicator}>
                <Feather name="external-link" size={12} color="#3b82f6" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  sponsorsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sponsorCard: {
    width: 120,
    height: 120,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderLogo: {
    width: 70,
    height: 70,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorName: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    width: '100%',
  },
  linkIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
