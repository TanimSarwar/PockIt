import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../store/theme';

interface ScreenHeaderProps {
  category?: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ category, title, rightAction }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {category && (
        <Text style={[styles.category, { color: theme.colors.accent }]}>
          {category.toUpperCase()}
        </Text>
      )}
      <View style={styles.titleRow}>
        {/* Left Anchor for symmetry */}
        <View style={styles.sideAnchor} /> 
        
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        
        {/* Right Anchor for action or symmetry */}
        <View style={styles.sideAnchor}>
          {rightAction || null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 20,
    gap: 2,
    alignItems: 'center',
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 1,
    textAlign: 'center',
    opacity: 0.9,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  sideAnchor: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
