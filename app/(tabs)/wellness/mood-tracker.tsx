import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../../store/theme';
import { lightImpact } from '../../../lib/haptics';

const { width } = Dimensions.get('window');

const MOODS = [
  { emoji: 'emotion-excited-outline', label: 'Great', color: '#FFD700' },
  { emoji: 'emotion-happy-outline', label: 'Good', color: '#4CAF50' },
  { emoji: 'emotion-neutral-outline', label: 'Okay', color: '#2196F3' },
  { emoji: 'emotion-sad-outline', label: 'Bad', color: '#FF9800' },
  { emoji: 'emotion-angry-outline', label: 'Awful', color: '#F44336' },
];

export default function MoodTracker() {
  const { theme, isDark } = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleMoodSelect = (index: number) => {
    lightImpact();
    setSelectedMood(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          style={styles.header}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>How are you feeling?</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Track your emotional well-being over time
          </Text>
        </Animated.View>

        <View style={styles.moodGrid}>
          {MOODS.map((mood, index) => (
            <Animated.View
              key={mood.label}
              entering={FadeInDown.delay(100 + index * 50).duration(500)}
            >
              <Pressable
                onPress={() => handleMoodSelect(index)}
                style={[
                  styles.moodCard,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedMood === index ? mood.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    borderWidth: selectedMood === index ? 2 : 1,
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name={mood.emoji as any} 
                  size={40} 
                  color={selectedMood === index ? mood.color : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.moodLabel, 
                  { 
                    color: selectedMood === index ? theme.colors.text : theme.colors.textSecondary,
                    fontWeight: selectedMood === index ? '700' : '500' 
                  }
                ]}>
                  {mood.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {selectedMood !== null && (
          <Animated.View 
            entering={ZoomIn}
            style={[styles.selectedContainer, { backgroundColor: theme.colors.surfaceSecondary }]}
          >
            <Text style={[styles.quote, { color: theme.colors.text }]}>
              "{selectedMood === 0 ? "Wonderful! Keep that energy going today." : 
                 selectedMood === 1 ? "Small joys lead to big happiness." : 
                 selectedMood === 2 ? "It's okay to just 'be' sometimes." : 
                 selectedMood === 3 ? "Take it easy on yourself. You're doing your best." : 
                 "Sending you strength. This too shall pass."}"
            </Text>
          </Animated.View>
        )}

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Journey</Text>
          <View style={[styles.emptyStats, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="chart-line" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No data yet. Keep logging your mood to see trends.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moodCard: {
    width: (width - 48 - 24) / 3,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  moodLabel: {
    marginTop: 8,
    fontSize: 13,
  },
  selectedContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  quote: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsSection: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyStats: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});
