import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';
import { useFavoritesStore } from '../../store/favorites';
import { FeatureCard } from './FeatureCard';
import { PockItInput } from './Input';
import type { FeatureCategory } from '../../constants/theme';

interface Feature {
  id: string;
  name: string;
  icon: string;
  description?: string;
  route: string;
  category: string;
}

interface Section {
  title: string;
  features: Feature[];
}

interface TabScreenProps {
  title: string;
  subtitle: string;
  icon: string;
  category: FeatureCategory;
  features?: Feature[];
  sections?: Section[];
  onNavigate: (route: string, id: string) => void;
}

export function TabScreen({ title, subtitle, icon, category, features, sections, onNavigate }: TabScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { togglePin, pinnedFeatures } = useFavoritesStore();
  const [search, setSearch] = useState('');

  const allFeatures = features ?? sections?.flatMap((s) => s.features) ?? [];
  
  const filteredFeatures = search.length > 0 
    ? allFeatures.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase()) || 
        f.description?.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const renderFeature = (f: Feature) => (
    <View key={f.id} style={styles.gridItem}>
      <FeatureCard
        icon={f.icon}
        title={f.name}
        description={f.description}
        category={category}
        onPress={() => onNavigate(f.route, f.id)}
        onLongPress={() => togglePin(f.id)}
        isPinned={pinnedFeatures.includes(f.id)}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Card */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={theme.colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerTop}>
              <View style={styles.vaultBadge}>
                <Text style={styles.vaultText}>VAULT</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countValue}>{allFeatures.length} tools</Text>
              </View>
            </View>

            <View style={styles.headerBottom}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>{subtitle}</Text>
              </View>
              <View style={styles.activeLabel}>
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <PockItInput 
              placeholder={`Search in ${title}...`}
              value={search}
              onChangeText={setSearch}
              icon={<MaterialCommunityIcons name="magnify" size={22} color={theme.colors.accent} />}
            />
          </View>

          {filteredFeatures ? (
            <View>
              <Text style={[styles.resultsLabel, { color: theme.colors.textSecondary }]}>
                {filteredFeatures.length} tools found
              </Text>
              <View style={styles.grid}>
                {filteredFeatures.map(renderFeature)}
              </View>
              {filteredFeatures.length === 0 && (
                <View style={styles.emptyResults}>
                  <MaterialCommunityIcons name="magnify-close" size={48} color={theme.colors.textTertiary} />
                  <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>No tools match your search</Text>
                </View>
              )}
            </View>
          ) : sections ? (
            sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
                    {section.title}
                  </Text>
                  <View style={[styles.sectionLine, { backgroundColor: theme.colors.borderLight }]} />
                </View>
                <View style={styles.grid}>
                  {section.features.map(renderFeature)}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.grid}>
              {allFeatures.map(renderFeature)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 10,
  },
  headerCard: {
    borderRadius: 28,
    padding: 24,
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vaultBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vaultText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  countPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countValue: {
    color: '#FF4C9F',
    fontSize: 12,
    fontWeight: '800',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  activeLabel: {
    alignItems: 'center',
  },
  activeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },

  body:    { paddingHorizontal: 16, paddingTop: 10 },
  
  searchContainer: {
    marginBottom: 24,
  },
  resultsLabel: {
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },

  section: { marginBottom: 30 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle:  { fontSize: 20, letterSpacing: -0.5 },
  sectionLine:   { flex: 1, height: 1, borderRadius: 1 },

  grid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16 },
});
