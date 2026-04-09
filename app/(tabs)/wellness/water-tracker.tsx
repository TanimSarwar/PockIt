import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { useWellnessStore } from '../../../store/wellness';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY_GOAL = 'pockit-water-goal';
const STORAGE_KEY_HISTORY = 'pockit-water-history';

interface WaterHistoryEntry {
  date: string;
  glasses: number;
  goal: number;
}

const QUICK_ADD = [
  { id: 'glass', label: '+1 Glass', amount: 1, tags: '250ml • Small', emoji: '💧', color: '#60A5FA' },
  { id: 'cup', label: '+1 Cup', amount: 1, tags: '350ml • Medium', emoji: '🥤', color: '#3B82F6' },
  { id: 'bottle', label: '+1 Bottle', amount: 3, tags: '750ml • Large', emoji: '🍾', color: '#2563EB' },
  { id: 'jug', label: '+2 Liters', amount: 8, tags: '2000ml • Max', emoji: '🌊', color: '#1D4ED8' },
];

const WATER_COLOR = '#3DBFE8';

// ─── Pulse dot for animation ──────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
    return () => cancelAnimation(o);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, s]} />
  );
}

// ─── Quick Add Card ──────────────────────────────────────────────────────────

function QuickAddCard({ item, onPress, theme }: { item: typeof QUICK_ADD[0]; onPress: () => void; theme: any }) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
        <View style={[sc.playBtn, { backgroundColor: theme.colors.surfaceTertiary }]}>
          <MaterialCommunityIcons name="plus" size={12} color={theme.colors.textTertiary} />
        </View>
        <View style={sc.iconWrap}>
          <Text style={sc.emoji}>{item.emoji}</Text>
        </View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{item.label}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{item.tags}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '500' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WaterTrackerScreen() {
  const { theme } = useTheme();
  const { waterIntake, addWater, resetWater } = useWellnessStore();

  const [goal, setGoal] = useState(8);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalInput, setGoalInput] = useState('8');
  const [history, setHistory] = useState<WaterHistoryEntry[]>([]);

  const progress = useSharedValue(0);

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

  // Update animated progress
  useEffect(() => {
    progress.value = withTiming(Math.min(waterIntake / goal, 1), {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [waterIntake, goal]);

  // Save history
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
      if (waterIntake + amount >= goal) {
        notificationSuccess();
      }
    },
    [addWater, waterIntake, goal],
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
    selectionFeedback();
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

  const percentage = Math.round(Math.min(waterIntake / goal, 1) * 100);

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

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / HYDRATE"
        title="Water Tracker"
        rightAction={
          <Pressable onPress={handleReset} style={styles.badge}>
            <MaterialCommunityIcons name="refresh" size={14} color={theme.colors.accent} />
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>RESET</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>TODAY'S PROGRESS</Text>
          <Text style={styles.featuredTitle}>{waterIntake} / {goal} Glasses</Text>
          
          <View style={styles.progressContainer}>
             <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
             </View>
             <Text style={styles.progressText}>{percentage}% Complete</Text>
          </View>

          {waterIntake >= goal && (
            <View style={styles.featuredStopBtn}>
               <Text style={styles.featuredStopText}>GOAL REACHED</Text>
               <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.success} />
            </View>
          )}
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>QUICK ADD</Text>
        <View style={styles.grid}>
          {QUICK_ADD.map(item => (
            <QuickAddCard key={item.id} item={item} onPress={() => handleAdd(item.amount)} theme={theme} />
          ))}
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Daily Goal</Text>
            <Pressable onPress={() => { lightImpact(); setShowGoalEdit(!showGoalEdit); }} style={[styles.editBtn, { backgroundColor: theme.colors.surfaceTertiary }]}>
               <MaterialCommunityIcons name={showGoalEdit ? "close" : "pencil"} size={16} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {showGoalEdit ? (
            <View style={styles.goalEditArea}>
              <TextInput
                style={[styles.goalInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={theme.colors.textTertiary}
              />
              <Pressable onPress={handleSaveGoal} style={[styles.goalSaveBtn, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.goalSaveText}>SAVE</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.goalDisplay}>
               <MaterialCommunityIcons name="flag-checkered" size={20} color={theme.colors.accent} />
               <Text style={[styles.goalDisplayText, { color: theme.colors.text }]}>{goal} glasses per day</Text>
            </View>
          )}

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>WEEKLY OVERVIEW</Text>
            <View style={styles.weekBars}>
              {last7Days.map((day) => {
                const entry = historyMap[day];
                const glasses = entry?.glasses || 0;
                const dGoal = entry?.goal || goal;
                const barPct = Math.min(glasses / dGoal, 1) * 100;
                const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
                const isToday = day === new Date().toISOString().split('T')[0];

                return (
                  <View key={day} style={styles.weekBarCol}>
                    <View style={[styles.weekBarTrack, { backgroundColor: theme.colors.surfaceTertiary }]}>
                      <View
                        style={[
                          styles.weekBarFill,
                          {
                            height: `${Math.max(barPct, 2)}%`,
                            backgroundColor: glasses >= dGoal ? theme.colors.success : theme.colors.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.weekBarDay, { color: isToday ? theme.colors.accent : theme.colors.textTertiary, fontWeight: isToday ? '900' : '500' }]}>{dayLabel.charAt(0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredCard: { borderRadius: 24, padding: 24, marginBottom: 24, minHeight: 160, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  featuredStopText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  featuredTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 16, textAlign: 'center' },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBar: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingsTitle: { fontSize: 18, fontWeight: '800' },
  editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalEditArea: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  goalInput: { flex: 1, padding: 12, borderRadius: 12, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  goalSaveBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  goalSaveText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  goalDisplay: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalDisplayText: { fontSize: 16, fontWeight: '600' },
  settingLabel: { fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1 },
  weekBars: { flexDirection: 'row', justifyContent: 'space-between', height: 80, gap: 8 },
  weekBarCol: { flex: 1, alignItems: 'center', gap: 8 },
  weekBarTrack: { flex: 1, width: '100%', borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 8 },
  weekBarDay: { fontSize: 10 },
});
