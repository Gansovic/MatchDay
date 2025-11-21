import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

interface StandingsTableProps {
  standings: StandingRow[];
  userTeamIds?: string[]; // Highlight user's teams
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, userTeamIds = [] }) => {
  const isUserTeam = (teamId: string) => userTeamIds.includes(teamId);

  const getFormBadgeStyle = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return { backgroundColor: '#10b981', text: 'W' }; // green
      case 'D':
        return { backgroundColor: '#666', text: 'D' }; // gray
      case 'L':
        return { backgroundColor: '#ef4444', text: 'L' }; // red
    }
  };

  if (standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No standings data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <View style={styles.posCell}>
          <Text style={styles.headerText}>Pos</Text>
        </View>
        <View style={styles.teamCell}>
          <Text style={styles.headerText}>Team</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>Pld</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>W</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>D</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>L</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>GD</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.headerText}>Pts</Text>
            </View>
            <View style={styles.formCell}>
              <Text style={styles.headerText}>Form</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Table Rows */}
      <ScrollView style={styles.tableBody}>
        {standings.map((standing, index) => {
          const highlighted = isUserTeam(standing.teamId);

          return (
            <View
              key={standing.teamId}
              style={[
                styles.dataRow,
                highlighted && styles.highlightedRow,
                index === standings.length - 1 && styles.lastRow,
              ]}
            >
              {/* Position - Sticky */}
              <View style={[styles.posCell, highlighted && styles.highlightedCell]}>
                <Text style={[styles.posText, highlighted && styles.highlightedText]}>
                  {standing.position}
                </Text>
              </View>

              {/* Team Name - Sticky */}
              <View style={[styles.teamCell, highlighted && styles.highlightedCell]}>
                <Text
                  style={[styles.teamText, highlighted && styles.highlightedText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {standing.teamName}
                </Text>
              </View>

              {/* Scrollable Stats */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <View style={styles.statsRow}>
                  <View style={styles.statCell}>
                    <Text style={styles.statText}>{standing.matchesPlayed}</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statText}>{standing.wins}</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statText}>{standing.draws}</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statText}>{standing.losses}</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statText, standing.goalDifference > 0 && styles.positiveGD]}>
                      {standing.goalDifference > 0 ? '+' : ''}
                      {standing.goalDifference}
                    </Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statText, styles.pointsText]}>{standing.points}</Text>
                  </View>

                  {/* Form Badges */}
                  <View style={styles.formCell}>
                    <View style={styles.formBadges}>
                      {standing.form.slice(0, 5).map((result, idx) => {
                        const formStyle = getFormBadgeStyle(result);
                        return (
                          <View
                            key={idx}
                            style={[styles.formBadge, { backgroundColor: formStyle.backgroundColor }]}
                          >
                            <Text style={styles.formBadgeText}>{formStyle.text}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  highlightedRow: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  highlightedCell: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  posCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teamCell: {
    width: 120,
    justifyContent: 'center',
    marginRight: 8,
  },
  statsScroll: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  formCell: {
    width: 140,
    justifyContent: 'center',
    marginLeft: 8,
  },
  tableBody: {
    maxHeight: 500,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  posText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statText: {
    fontSize: 13,
    color: '#ccc',
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  positiveGD: {
    color: '#10b981',
  },
  highlightedText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  formBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
