import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { useWellnessStore } from '../../../store/wellness';
import { lightImpact, mediumImpact, notificationSuccess } from '../../../lib/haptics';

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY_GOAL = 'pockit-water-goal';
const STORAGE_KEY_HISTORY = 'pockit-water-history';

interface WaterHistoryEntry {
  date: string;
  glasses: number;
  goal: number;
}

const QUICK_ADD = [
  { label: '+1 Glass', amount: 1, icon: 'cup-water' as const },
  { label: '+1 Cup', amount: 1, icon: 'coffee' as const },
  { label: '+1 Bottle', amount: 3, icon: 'bottle-wine-outline' as const },
];

const WATER_COLOR = '#3DBFE8';
const WATER_DARK = '#0C87B8';

// ─── Component ──────────────────────────────────────────────────────────────

export default function WaterTrackerScreen() {
  const { theme, isDark } = useTheme();
  const { waterIntake, addWater, resetWater } = useWellnessStore();

  const [goal, setGoal] = useState(8);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalInput, setGoalInput] = useState('8');
  const [history, setHistory] = useState<WaterHistoryEntry[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const splashAnim = useRef(new Animated.Value(0)).current;

  // Load persisted data
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_GOAL).then((val) => {
      if (val) {
        const g = parseInt(val, 10);
        if (g > 0) {
          setGoal(g);
          setGoalInput(g.toString());
        }
      }
    });
    AsyncStorage.getItem(STORAGE_KEY_HISTORY).then((val) => {
      if (val) {
        try {
          setHistory(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  // Animate fill level
  useEffect(() => {
    const targetFill = Math.min(waterIntake / goal, 1);
    Animated.timing(fillAnim, {
      toValue: targetFill,
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [waterIntake, goal, fillAnim]);

  // Save today's entry to history when intake changes
  useEffect(() => {
    if (waterIntake > 0) {
      const today = new Date().toISOString().split('T')[0];
      setHistory((prev) => {
        const updated = prev.filter((h) => h.date !== today);
        const newHistory = [{ date: today, glasses: waterIntake, goal }, ...updated].slice(0, 30);
        AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory)).catch(() => {});
        return newHistory;
      });
    }
  }, [waterIntake, goal]);

  const handleAdd = useCallback(
    (amount: number) => {
      mediumImpact();
      for (let i = 0; i < amount; i++) {
        addWater();
      }

      // Splash animation
      splashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(splashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(splashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (waterIntake + amount >= goal) {
        notificationSuccess();
      }
    },
    [addWater, waterIntake, goal, splashAnim],
  );

  const handleSaveGoal = useCallback(() => {
    const g = parseInt(goalInput, 10);
    if (!g || g < 1 || g > 50) {
      Alert.alert('Invalid Goal', 'Please enter a number between 1 and 50.');
      return;
    }
    setGoal(g);
    AsyncStorage.setItem(STORAGE_KEY_GOAL, g.toString()).catch(() => {});
    setShowGoalEdit(false);
    lightImpact();
  }, [goalInput]);

  const handleReset = useCallback(() => {
    Alert.alert('Reset Water', 'Reset today\'s water intake to 0?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetWater();
          lightImpact();
        },
      },
    ]);
  }, [resetWater]);

  const progress = Math.min(waterIntake / goal, 1);
  const percentage = Math.round(progress * 100);

  // Weekly history
  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const historyMap = useMemo(() => {
    const map: Record<string, WaterHistoryEntry> = {};
    history.forEach((h) => {
      map[h.date] = h;
    });
    return map;
  }, [history]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const splashScale = splashAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 0.8],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          Water Tracker
        </Text>
        <Pressable onPress={handleReset} hitSlop={12}>
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Water Level Visual */}
        <Animated.View
          style={[styles.waterVisual, { transform: [{ scale: splashScale }] }]}
        >
          <View
            style={[
              styles.waterGlass,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: WATER_COLOR + '40',
              },
            ]}
          >
            <Animated.View
              style={[
                styles.waterFill,
                {
                  height: fillHeight,
                  backgroundColor: WATER_COLOR + '60',
                },
              ]}
            >
              <View
                style={[styles.waterWave, { backgroundColor: WATER_COLOR + '30' }]}
              />
            </Animated.View>
            <View style={styles.waterContent}>
              <MaterialCommunityIcons
                name="water"
                size={36}
                color={waterIntake >= goal ? '#FFFFFF' : WATER_COLOR}
              />
              <Text
                style={[
                  styles.waterCount,
                  {
                    color: waterIntake >= goal ? '#FFFFFF' : theme.colors.text,
                    fontFamily: theme.fontFamily.bold,
                  },
                ]}
              >
                {waterIntake}
              </Text>
              <Text
                style={[
                  styles.waterGoal,
                  {
                    color:
                      waterIntake >= goal
                        ? 'rgba(255,255,255,0.8)'
                        : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
              >
                of {goal} glasses
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text
              style={[
                styles.progressLabel,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Daily Progress
            </Text>
            <Text
              style={[
                styles.progressPercent,
                {
                  color: WATER_COLOR,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {percentage}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.surfaceTertiary },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: WATER_COLOR,
                  width: fillAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Quick add buttons */}
        <View style={styles.quickAddRow}>
          {QUICK_ADD.map((qa) => (
            <Pressable
              key={qa.label}
              onPress={() => handleAdd(qa.amount)}
              style={[
                styles.quickAddBtn,
                {
                  backgroundColor: WATER_COLOR + '15',
                  borderColor: WATER_COLOR + '40',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={qa.icon}
                size={24}
                color={WATER_COLOR}
              />
              <Text
                style={[
                  styles.quickAddLabel,
                  {
                    color: WATER_COLOR,
                    fontFamily: theme.fontFamily.medium,
                  },
                ]}
              >
                {qa.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Goal setting */}
        <Pressable
          onPress={() => {
            setGoalInput(goal.toString());
            setShowGoalEdit(!showGoalEdit);
            lightImpact();
          }}
          style={[
            styles.goalRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="flag-checkered"
            size={20}
            color={theme.colors.text}
          />
          <Text
            style={[
              styles.goalText,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.medium,
              },
            ]}
          >
            Daily Goal: {goal} glasses
          </Text>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color={theme.colors.textTertiary}
          />
        </Pressable>

        {showGoalEdit && (
          <View
            style={[
              styles.goalEditRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.goalInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              maxLength={2}
              underlineColorAndroid="transparent"
            />
            <Pressable
              onPress={handleSaveGoal}
              style={[
                styles.goalSaveBtn,
                { backgroundColor: theme.colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.goalSaveText,
                  { fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>
        )}

        {/* Reminder toggle */}
        <Pressable
          onPress={() => {
            lightImpact();
            setReminderEnabled(!reminderEnabled);
            // In production, hook up to expo-notifications for reminders
          }}
          style={[
            styles.toggleRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={20}
            color={theme.colors.text}
          />
          <Text
            style={[
              styles.toggleLabel,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.medium,
              },
            ]}
          >
            Hydration Reminders
          </Text>
          <View
            style={[
              styles.toggleSwitch,
              {
                backgroundColor: reminderEnabled
                  ? theme.colors.accent
                  : theme.colors.surfaceTertiary,
              },
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                {
                  transform: [{ translateX: reminderEnabled ? 18 : 2 }],
                },
              ]}
            />
          </View>
        </Pressable>

        {/* Weekly History */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          This Week
        </Text>
        <View
          style={[
            styles.weekChart,
            {
              backgroundColor: theme.colors.surface,
              ...theme.shadows.card,
            },
          ]}
        >
          <View style={styles.weekBars}>
            {last7Days.map((day) => {
              const entry = historyMap[day];
              const glasses = entry?.glasses || 0;
              const dayGoal = entry?.goal || goal;
              const barPct = Math.min(glasses / dayGoal, 1) * 100;
              const dayLabel = new Date(
                day + 'T00:00:00',
              ).toLocaleDateString('en', { weekday: 'short' });
              const isToday =
                day === new Date().toISOString().split('T')[0];

              return (
                <View key={day} style={styles.weekBarCol}>
                  <Text
                    style={[
                      styles.weekBarValue,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                  >
                    {glasses > 0 ? glasses : ''}
                  </Text>
                  <View
                    style={[
                      styles.weekBarTrack,
                      { backgroundColor: theme.colors.surfaceTertiary },
                    ]}
                  >
                    <View
                      style={[
                        styles.weekBarFill,
                        {
                          height: `${Math.max(barPct, 2)}%`,
                          backgroundColor:
                            glasses >= dayGoal ? WATER_COLOR : WATER_COLOR + '60',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.weekBarDay,
                      {
                        color: isToday
                          ? WATER_COLOR
                          : theme.colors.textTertiary,
                        fontFamily: isToday
                          ? theme.fontFamily.semiBold
                          : theme.fontFamily.regular,
                      },
                    ]}
                  >
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  waterVisual: {
    alignItems: 'center',
    marginVertical: 20,
  },
  waterGlass: {
    width: 180,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  waterWave: {
    height: 8,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  waterContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waterCount: {
    fontSize: 40,
  },
  waterGoal: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickAddBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  quickAddLabel: {
    fontSize: 12,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
  },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
    borderWidth: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  goalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  goalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  weekChart: {
    borderRadius: 16,
    padding: 16,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  weekBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekBarValue: {
    fontSize: 10,
    height: 14,
  },
  weekBarTrack: {
    flex: 1,
    width: '70%',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  weekBarDay: {
    fontSize: 10,
    marginTop: 4,
  },
});
