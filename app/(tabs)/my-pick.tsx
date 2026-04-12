import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '../../store/theme';
import { useFavoritesStore } from '../../store/favorites';
import { features, categories } from '../../constants/features';
import { TabScreen } from '../../components/ui/TabScreen';
import { lightImpact, mediumImpact } from '../../lib/haptics';
import { FeatureCard } from '../../components/ui/FeatureCard';

export default function MyPickScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { pinnedFeatures, togglePin, addRecent } = useFavoritesStore();
  const [sortBy, setSortBy] = useState<'alphabetical' | 'category'>('category');

  const myPicks = useMemo(() => {
    return pinnedFeatures
      .map(id => features.find(f => f.id === id))
      .filter(Boolean) as typeof features;
  }, [pinnedFeatures]);

  const sortedPicks = useMemo(() => {
    if (sortBy === 'alphabetical') {
      return [...myPicks].sort((a, b) => a.name.localeCompare(b.name));
    }
    return myPicks; // Default category order from features constant
  }, [myPicks, sortBy]);

  const sections = useMemo(() => {
    if (sortBy === 'alphabetical') {
      return [{ title: 'All Tools', features: sortedPicks }];
    }

    // Group by category
    const grouped = categories.map(cat => ({
      title: cat.label,
      features: sortedPicks.filter(f => f.category === cat.id)
    })).filter(s => s.features.length > 0);

    return grouped;
  }, [sortedPicks, sortBy]);

  if (pinnedFeatures.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="star-off-outline" size={64} color={theme.colors.textTertiary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Picks Yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Long press any tool in other categories to add them to your picks for quick access.
        </Text>
        <Pressable 
          style={[styles.browseBtn, { backgroundColor: theme.colors.accent }]}
          onPress={() => { lightImpact(); router.push('/(tabs)/tools'); }}
        >
          <Text style={styles.browseBtnText}>Browse Tools</Text>
        </Pressable>
      </View>
    );
  }

  const sortToggle = (
    <View style={[styles.sortContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
      <Pressable 
        onPress={() => { setSortBy('alphabetical'); lightImpact(); }}
        style={[
          styles.sortBtn, 
          sortBy === 'alphabetical' && { backgroundColor: theme.colors.accentMuted }
        ]}
      >
        <MaterialCommunityIcons 
          name="sort-alphabetical-ascending" 
          size={16} 
          color={sortBy === 'alphabetical' ? theme.colors.accent : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.sortText, 
          { color: sortBy === 'alphabetical' ? theme.colors.accent : theme.colors.textSecondary }
        ]}>A-Z</Text>
      </Pressable>
      
      <View style={[styles.sortDivider, { backgroundColor: theme.colors.borderLight }]} />
      
      <Pressable 
        onPress={() => { setSortBy('category'); lightImpact(); }}
        style={[
          styles.sortBtn, 
          sortBy === 'category' && { backgroundColor: theme.colors.accentMuted }
        ]}
      >
        <MaterialCommunityIcons 
          name="shape-outline" 
          size={16} 
          color={sortBy === 'category' ? theme.colors.accent : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.sortText, 
          { color: sortBy === 'category' ? theme.colors.accent : theme.colors.textSecondary }
        ]}>By Category</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreen
        title="My Pick"
        subtitle="Your favorite tools collection"
        icon="star"
        category="daily"
        sections={sections}
        onNavigate={(route, id) => { addRecent(id); router.push(route as any); }}
        topActions={sortToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 2,
  }
});
