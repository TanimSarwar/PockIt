import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Easing,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { useWellnessStore } from '../../../store/wellness';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_GOAL = 10000;
const STEP_LENGTH_M = 0.762; // average step length in meters
const CALORIES_PER_STEP = 0.04; // rough estimate
const STORAGE_KEY_GOAL = 'pockit-step-goal';

const STEP_COLOR = '#10B981';

// ─── Component ──────────────────────────────────────────────────────────────

export default function StepCounterScreen() {
  const { theme } = useTheme();
  const { stepCount, setStepCount } = useWellnessStore();

  const [isPedometerAvailable, setIsPedometerAvailable] = useState<
    boolean | null
  >(null);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalInput, setGoalInput] = useState(DEFAULT_GOAL.toString());

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load goal
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
  }, []);

  // Check pedometer availability and subscribe
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);

        if (available) {
          // Get today's step count
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();

          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            setStepCount(result.steps);
          } catch {
            // Some platforms may not support getStepCountAsync
          }

          // Subscribe to live updates
          subscription = Pedometer.watchStepCount((result) => {
            setStepCount(result.steps);
          });
        }
      } catch {
        setIsPedometerAvailable(false);
      }
    };

    setup();

    return () => {
      subscription?.remove();
    };
  }, [setStepCount]);

  // Animate progress ring
  useEffect(() => {
    const progress = Math.min(stepCount / goal, 1);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [stepCount, goal, progressAnim]);

  const handleSaveGoal = useCallback(() => {
    const g = parseInt(goalInput, 10);
    if (!g || g < 100 || g > 100000) {
      Alert.alert('Invalid Goal', 'Please enter a number between 100 and 100,000.');
      return;
    }
    setGoal(g);
    AsyncStorage.setItem(STORAGE_KEY_GOAL, g.toString()).catch(() => {});
    setShowGoalEdit(false);
    lightImpact();
  }, [goalInput]);

  const progress = Math.min(stepCount / goal, 1);
  const percentage = Math.round(progress * 100);
  const distanceKm = (stepCount * STEP_LENGTH_M) / 1000;
  const calories = Math.round(stepCount * CALORIES_PER_STEP);
  const remaining = Math.max(0, goal - stepCount);

  // Circular progress dimensions
  const RING_SIZE = 240;
  const STROKE_WIDTH = 12;
  const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // For the circular progress we use a view-based approach
  // with a clipped rotating half-circle technique
  const rotation = progressAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg', '360deg'],
  });

  const opacity1 = progressAnim.interpolate({
    inputRange: [0, 0.5, 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const opacity2 = progressAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  const rotation2 = progressAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Web/unsupported platform fallback
  if (isPedometerAvailable === false && Platform.OS === 'web') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
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
            Step Counter
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.fallbackContainer}>
          <MaterialCommunityIcons
            name="shoe-print"
            size={64}
            color={theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.fallbackTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Pedometer Not Available
          </Text>
          <Text
            style={[
              styles.fallbackText,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            Step counting requires a physical device with motion sensors. This
            feature is not available on web or in the simulator.
          </Text>
          <Text
            style={[
              styles.fallbackHint,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            Try running the app on a physical iOS or Android device.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Step Counter
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pedometer status */}
        {isPedometerAvailable === null && (
          <View
            style={[
              styles.statusBar,
              { backgroundColor: theme.colors.warningBg },
            ]}
          >
            <MaterialCommunityIcons
              name="loading"
              size={16}
              color={theme.colors.warning}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: theme.colors.warning,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Checking pedometer availability...
            </Text>
          </View>
        )}

        {isPedometerAvailable === false && (
          <View
            style={[
              styles.statusBar,
              { backgroundColor: theme.colors.errorBg },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color={theme.colors.error}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: theme.colors.error,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Pedometer not available on this device. Showing cached data.
            </Text>
          </View>
        )}

        {/* Circular Progress */}
        <View style={styles.ringContainer}>
          <View
            style={[
              styles.ringOuter,
              {
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: RING_SIZE / 2,
                borderColor: theme.colors.surfaceTertiary,
                borderWidth: STROKE_WIDTH,
              },
            ]}
          >
            {/* Simple progress overlay using animated border */}
          </View>

          {/* Progress arc (simplified with a filled ring approach) */}
          <View style={[styles.ringOverlay, { width: RING_SIZE, height: RING_SIZE }]}>
            {/* Left half */}
            <View style={styles.halfLeft}>
              <Animated.View
                style={[
                  styles.halfCircle,
                  {
                    width: RING_SIZE / 2,
                    height: RING_SIZE,
                    borderTopLeftRadius: RING_SIZE / 2,
                    borderBottomLeftRadius: RING_SIZE / 2,
                    borderWidth: STROKE_WIDTH,
                    borderRightWidth: 0,
                    borderColor: STEP_COLOR,
                    opacity: opacity2,
                    transform: [
                      { translateX: RING_SIZE / 4 },
                      { rotate: rotation2 },
                      { translateX: -RING_SIZE / 4 },
                    ],
                  },
                ]}
              />
            </View>
            {/* Right half */}
            <View style={styles.halfRight}>
              <Animated.View
                style={[
                  styles.halfCircle,
                  {
                    width: RING_SIZE / 2,
                    height: RING_SIZE,
                    borderTopRightRadius: RING_SIZE / 2,
                    borderBottomRightRadius: RING_SIZE / 2,
                    borderWidth: STROKE_WIDTH,
                    borderLeftWidth: 0,
                    borderColor: STEP_COLOR,
                    transform: [
                      { translateX: -RING_SIZE / 4 },
                      { rotate: rotation },
                      { translateX: RING_SIZE / 4 },
                    ],
                  },
                ]}
              />
            </View>
          </View>

          {/* Center content */}
          <View style={[styles.ringCenter, { width: RING_SIZE, height: RING_SIZE }]}>
            <MaterialCommunityIcons
              name="shoe-print"
              size={28}
              color={STEP_COLOR}
            />
            <Text
              style={[
                styles.stepCount,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {stepCount.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.stepGoal,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              / {goal.toLocaleString()} steps
            </Text>
            <Text
              style={[
                styles.percentage,
                {
                  color: STEP_COLOR,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={22}
              color="#3B82F6"
            />
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {distanceKm.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Kilometers
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="fire"
              size={22}
              color="#F59E0B"
            />
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {calories}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Calories
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="flag-variant-outline"
              size={22}
              color={STEP_COLOR}
            />
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {remaining.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Steps Left
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={22}
              color="#8B5CF6"
            />
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {Math.round((stepCount * STEP_LENGTH_M) / 1.4 / 60)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Active Min
            </Text>
          </View>
        </View>

        {/* Goal setting */}
        <Pressable
          onPress={() => {
            lightImpact();
            setGoalInput(goal.toString());
            setShowGoalEdit(!showGoalEdit);
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
            Daily Goal: {goal.toLocaleString()} steps
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
              maxLength={6}
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

        {/* Goal completion message */}
        {stepCount >= goal && (
          <View
            style={[
              styles.completionBanner,
              { backgroundColor: STEP_COLOR + '15' },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy"
              size={24}
              color={STEP_COLOR}
            />
            <Text
              style={[
                styles.completionText,
                {
                  color: STEP_COLOR,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              Goal reached! Great job today!
            </Text>
          </View>
        )}
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    height: 240,
  },
  ringOuter: {
    position: 'absolute',
  },
  ringOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  halfLeft: {
    width: '50%',
    height: '100%',
    overflow: 'hidden',
  },
  halfRight: {
    width: '50%',
    height: '100%',
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontSize: 36,
    marginTop: 4,
  },
  stepGoal: {
    fontSize: 13,
  },
  percentage: {
    fontSize: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%' as any,
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
  },
  statLabel: {
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
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  completionText: {
    flex: 1,
    fontSize: 15,
  },
  // Fallback
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 20,
    marginTop: 8,
  },
  fallbackText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  fallbackHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
