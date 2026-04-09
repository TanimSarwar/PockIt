import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useTheme } from '../../store/theme';
import { useFavoritesStore } from '../../store/favorites';
import { FeatureCard } from './FeatureCard';
import { PockItInput } from './Input';
import type { FeatureCategory } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface Feature {
  id: string;
  name: string;
  icon: string;
  description?: string;
  route: string;
  category: string;
  layout?: 'regular' | 'wide' | 'narrow';
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

const Bubble = ({ size, top, left, delay, opacity = 0.15 }: { size: number, top: number, left: number, delay: number, opacity?: number }) => {
  const move = useSharedValue(0);

  useEffect(() => {
    move.value = withRepeat(
      withTiming(1, { duration: 3000 + delay, }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(move.value, [0, 1], [0, -15]) },
      { translateX: interpolate(move.value, [0, 1], [0, 10]) },
    ],
  }));

  return (
    <Animated.View 
      style={[
        styles.bubble, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          top, 
          left, 
          opacity,
          backgroundColor: '#FFFFFF'
        },
        animatedStyle
      ]} 
    />
  );
};

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

  const renderFeature = (f: Feature, index: number) => {
    const isFullWidth = f.layout === 'wide' || f.layout === 'narrow';
    return (
      <Animated.View 
        key={f.id} 
        entering={FadeInDown.delay(index * 50).springify().damping(12)}
        style={[styles.gridItem, { width: isFullWidth ? '100%' : '48%' }]}
      >
        <FeatureCard
          icon={f.icon}
          title={f.name}
          description={f.description}
          category={category}
          layout={f.layout}
          onPress={() => onNavigate(f.route, f.id)}
          onLongPress={() => togglePin(f.id)}
          isPinned={pinnedFeatures.includes(f.id)}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Card */}
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          style={styles.headerWrapper}
        >
          <LinearGradient
            colors={theme.colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            {/* Decorative Bubbles */}
            <Bubble size={120} top={-40} left={-30} delay={0} opacity={0.12} />
            <Bubble size={80} top={20} left={width - 100} delay={500} opacity={0.08} />
            <Bubble size={40} top={80} left={width / 2} delay={1000} opacity={0.1} />
            
            <View style={styles.headerTop}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>{subtitle}</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={[styles.countValue, { color: theme.colors.accent }]}>
                  {allFeatures.length} {allFeatures.length === 1 ? 'tool' : 'tools'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.body}>
          {/* Floating Overlapping Search Bar */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.floatingSearchWrapper}
          >
            <PockItInput 
              placeholder={`Quick search ${title.toLowerCase()}...`}
              value={search}
              onChangeText={setSearch}
              icon={<MaterialCommunityIcons name="magnify" size={24} color={theme.colors.accent} />}
              containerStyle={styles.floatingSearchContainer}
              wrapperStyle={styles.floatingSearchWrapperStyle}
              inputStyle={styles.floatingSearchInput}
            />
          </Animated.View>

          {filteredFeatures ? (
            <View>
              <Text style={[styles.resultsLabel, { color: theme.colors.textSecondary }]}>
                {filteredFeatures.length} tools found
              </Text>
              <View style={styles.grid}>
                {filteredFeatures.map((f, i) => renderFeature(f, i))}
              </View>
              {filteredFeatures.length === 0 && (
                <View style={styles.emptyResults}>
                  <MaterialCommunityIcons name="magnify-close" size={48} color={theme.colors.textTertiary} />
                  <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>No tools match your search</Text>
                </View>
              )}
            </View>
          ) : sections ? (
            sections.map((section, sIndex) => (
              <View key={section.title} style={styles.section}>
                {sIndex > 0 && (
                  <View style={styles.dividerContainer}>
                    <LinearGradient
                      colors={['transparent', theme.colors.borderLight, 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dividerGradient}
                    />
                    <View style={[styles.dividerDot, { backgroundColor: theme.colors.borderLight }]} />
                  </View>
                )}
                
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <View style={styles.grid}>
                    {section.features.map((f, i) => renderFeature(f, i))}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.grid}>
              {allFeatures.map((f, i) => renderFeature(f, i))}
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
    marginBottom: 8,
  },
  headerCard: {
    borderRadius: 32,
    padding: 24,
    minHeight: 130,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingBottom: 40, // Space for the overlap
  },
  bubble: {
    position: 'absolute',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  integratedSearch: {
    zIndex: 1,
  },
  glassSearchContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 46,
  },
  glassSearchInput: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  countPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  countValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: -2,
    fontWeight: '500',
  },

  body:    { paddingHorizontal: 16, paddingTop: 0 },
  
  floatingSearchWrapper: {
    marginTop: -28,
    marginBottom: 24,
    zIndex: 10,
  },
  floatingSearchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  floatingSearchWrapperStyle: {
    backgroundColor: 'transparent',
    borderRadius: 28,
    height: '100%',
    paddingHorizontal: 16,
  },
  floatingSearchInput: {
    fontSize: 16,
    fontWeight: '600',
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

  section: { marginBottom: 0 },
  sectionCard: {
    borderRadius: 24,
    padding: 10,
    paddingBottom: 0, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  dividerContainer: {
    height: 6,
    marginTop: 4,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerGradient: {
    width: '100%',
    height: 1,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    opacity: 0.4,
  },

  resultsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { marginBottom: 12 },
});
