import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { generateColorFromString } from '../../lib/utils/icon-helpers';

type FallbackIconType = 'trophy' | 'calendar' | 'users' | 'shield';

interface IconImageProps {
  url?: string | null;
  fallbackIcon: FallbackIconType;
  size?: number;
  fallbackColor?: string;
  fallbackLetter?: string; // For initials fallback
  rounded?: boolean; // true = circular, false = rounded square
}

export const IconImage: React.FC<IconImageProps> = ({
  url,
  fallbackIcon,
  size = 56,
  fallbackColor,
  fallbackLetter,
  rounded = true,
}) => {
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(false);

  const showFallback = !url || error;
  const borderRadius = rounded ? size / 2 : size * 0.2;
  const iconColor = fallbackColor || (fallbackLetter ? generateColorFromString(fallbackLetter) : '#3b82f6');

  // Reset error state when URL changes
  React.useEffect(() => {
    if (url) {
      setError(false);
      setLoading(true);
    }
  }, [url]);

  const renderFallbackIcon = () => {
    const iconSize = size * 0.5;
    const iconStyle = {
      width: iconSize,
      height: iconSize,
    };

    switch (fallbackIcon) {
      case 'trophy':
        return (
          <View style={iconStyle}>
            {/* Trophy base */}
            <View style={styles.trophyBase} />
            {/* Trophy cup */}
            <View style={[styles.trophyCup, { width: iconSize * 0.8, height: iconSize * 0.6 }]} />
          </View>
        );

      case 'calendar':
        return (
          <View style={[styles.calendar, iconStyle]}>
            <View style={styles.calendarHeader} />
            <View style={styles.calendarGrid}>
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
              <View style={styles.calendarDot} />
            </View>
          </View>
        );

      case 'users':
        return (
          <View style={[styles.users, iconStyle]}>
            {/* Two overlapping user circles */}
            <View style={[styles.userCircle, { width: iconSize * 0.4, height: iconSize * 0.4, left: 0 }]} />
            <View style={[styles.userCircle, { width: iconSize * 0.4, height: iconSize * 0.4, right: 0 }]} />
          </View>
        );

      case 'shield':
        return (
          <View style={[styles.shield, iconStyle]}>
            {/* Shield shape using border */}
            <View style={[styles.shieldInner, { width: iconSize * 0.8, height: iconSize * 0.9 }]} />
          </View>
        );

      default:
        return null;
    }
  };

  if (showFallback) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius, backgroundColor: iconColor }]}>
        {fallbackLetter ? (
          <View style={styles.letterContainer}>
            <Text style={[styles.letter, { fontSize: size * 0.4 }]}>
              {fallbackLetter.toUpperCase()}
            </Text>
          </View>
        ) : (
          renderFallbackIcon()
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <Image
        source={{ uri: url! }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && (
        <View style={[styles.loadingOverlay, { width: size, height: size, borderRadius }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontWeight: 'bold',
    color: '#fff',
  },
  // Trophy icon
  trophyBase: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '30%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  trophyCup: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
  },
  // Calendar icon
  calendar: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
    padding: 4,
  },
  calendarHeader: {
    width: '100%',
    height: '25%',
    backgroundColor: '#fff',
    borderRadius: 2,
    marginBottom: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDot: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  // Users icon
  users: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  userCircle: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 100,
    top: '50%',
    marginTop: -10,
  },
  // Shield icon
  shield: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldInner: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
