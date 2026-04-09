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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { useWellnessStore } from '../../../store/wellness';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact } from '../../../lib/haptics';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_GOAL = 10000;
const STEP_LENGTH_M = 0.762; 
const CALORIES_PER_STEP = 0.04;
const STORAGE_KEY_GOAL = 'pockit-step-goal';
const STEP_COLOR = '#10B981';

// ─── Component ──────────────────────────────────────────────────────────────

export default function StepCounterScreen() {
  const { theme } = useTheme();
  const { stepCount, setStepCount } = useWellnessStore();

  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalInput, setGoalInput] = useState(DEFAULT_GOAL.toString());

  const progressAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const setup = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);
        if (available) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            setStepCount(result.steps);
          } catch {}
          subscription = Pedometer.watchStepCount((result) => {
            setStepCount(result.steps);
          });
        }
      } catch {
        setIsPedometerAvailable(false);
      }
    };
    setup();
    return () => subscription?.remove();
  }, [setStepCount]);

  useEffect(() => {
    const progress = Math.min(stepCount / goal, 1);
    Animated.timing(progressAnim, { toValue: progress, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [stepCount, goal]);

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

  const RING_SIZE = 240;

  if (isPedometerAvailable === false && Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader category="WELLNESS / ACTIVITY" title="Step Counter" subtitle="Pedometer requires motion sensors." />
        <View style={styles.fallbackContainer}>
          <MaterialCommunityIcons name="shoe-print" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.fallbackTitle, { color: theme.colors.text }]}>Not Available</Text>
          <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>This feature requires physical motion sensors not present on web.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / ACTIVITY"
        title="Step Counter"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ringContainer}>
           <View style={[styles.ringInner, { backgroundColor: theme.colors.surface, elevation: 4 }]}>
              <MaterialCommunityIcons name="shoe-print" size={28} color={STEP_COLOR} />
              <Text style={[styles.stepCountText, { color: theme.colors.text }]}>{stepCount.toLocaleString()}</Text>
              <Text style={[styles.stepGoalText, { color: theme.colors.textSecondary }]}>/ {goal.toLocaleString()} steps</Text>
              <Text style={[styles.percentageText, { color: STEP_COLOR }]}>{percentage}%</Text>
           </View>
        </View>

        <View style={styles.statsGrid}>
          <Card icon="map-marker-distance" color="#3B82F6" value={distanceKm.toFixed(2)} label="Kilometers" />
          <Card icon="fire" color="#F59E0B" value={calories.toString()} label="Calories" />
          <Card icon="flag-variant-outline" color={STEP_COLOR} value={remaining.toLocaleString()} label="Steps Left" />
          <Card icon="clock-outline" color="#8B5CF6" value={Math.round((stepCount * STEP_LENGTH_M) / 1.4 / 60).toString()} label="Active Min" />
        </View>

        <Pressable onPress={() => { setGoalInput(goal.toString()); setShowGoalEdit(!showGoalEdit); lightImpact(); }} style={[styles.goalRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
          <MaterialCommunityIcons name="flag-checkered" size={20} color={theme.colors.text} />
          <Text style={[styles.goalText, { color: theme.colors.text }]}>Daily Goal: {goal.toLocaleString()} steps</Text>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        {showGoalEdit && (
          <View style={[styles.goalEditRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
            <TextInput style={[styles.goalInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]} value={goalInput} onChangeText={setGoalInput} keyboardType="number-pad" maxLength={6} underlineColorAndroid="transparent" />
            <Pressable onPress={handleSaveGoal} style={[styles.goalSaveBtn, { backgroundColor: theme.colors.accent }]}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Card({ icon, color, value, label }: { icon: any, color: string, value: string, label: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  fallbackContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  fallbackTitle: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  fallbackText: { fontSize: 16, textAlign: 'center', marginTop: 8 },
  ringContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 32 },
  ringInner: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: 'rgba(16, 185, 129, 0.1)' },
  stepCountText: { fontSize: 40, fontWeight: '800', marginTop: 4 },
  stepGoalText: { fontSize: 13, fontWeight: '600' },
  percentageText: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%' as any, flexGrow: 1, flexBasis: '45%', alignItems: 'center', padding: 16, borderRadius: 24, gap: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  goalText: { flex: 1, fontSize: 15, fontWeight: '700' },
  goalEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  goalInput: { flex: 1, padding: 12, borderRadius: 12, fontSize: 18, textAlign: 'center', ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  goalSaveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
});
