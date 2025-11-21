import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MediaFilterTabsProps {
  currentFilter: 'all' | 'image' | 'video';
  onFilterChange: (filter: 'all' | 'image' | 'video') => void;
  counts: { all: number; image: number; video: number };
}

export const MediaFilterTabs: React.FC<MediaFilterTabsProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const tabs: { key: 'all' | 'image' | 'video'; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'image', label: `Photos (${counts.image})` },
    { key: 'video', label: `Videos (${counts.video})` },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            currentFilter === tab.key && styles.activeTab,
          ]}
          onPress={() => onFilterChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              currentFilter === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
  },
});
