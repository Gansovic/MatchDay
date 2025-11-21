import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecentFormProps {
  form: ('W' | 'D' | 'L')[];
}

export const RecentForm: React.FC<RecentFormProps> = ({ form }) => {
  if (form.length === 0) {
    return null;
  }

  const getResultColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return '#10b981';
      case 'D':
        return '#f59e0b';
      case 'L':
        return '#ef4444';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.indicator} />
          <Text style={styles.title}>Recent Form</Text>
        </View>
      </View>

      <View style={styles.formRow}>
        {form.map((result, index) => (
          <View
            key={index}
            style={[
              styles.resultBadge,
              { backgroundColor: getResultColor(result) },
            ]}
          >
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ))}
        {form.length < 5 && (
          <Text style={styles.emptyText}>
            {5 - form.length} more match{5 - form.length > 1 ? 'es' : ''} to show full form
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 4,
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  resultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});
