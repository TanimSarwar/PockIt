import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Exercise Definitions ───────────────────────────────────────────────────

interface BreathPhase {
  label: string;
  duration: number; // seconds
}

interface BreathExercise {
  id: string;
  name: string;
  pattern: string;
  description: string;
  phases: BreathPhase[];
  emoji: string;
  color: string;
  bg: string;
}

const EXERCISES: BreathExercise[] = [
  {
    id: 'box',
    name: 'Box Breath',
    pattern: '4-4-4-4',
    description: '4s In • 4s Hold • 4s Out • 4s Hold',
    emoji: '📦',
    color: '#3B82F6',
    bg: '#DDEEFF',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Breathe Out', duration: 4 },
      { label: 'Hold', duration: 4 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Relax',
    pattern: '4-7-8',
    description: '4s In • 7s Hold • 8s Out',
    emoji: '🌙',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Breathe Out', duration: 8 },
    ],
  },
  {
    id: 'deep',
    name: 'Deep Calm',
    pattern: '4-6',
    description: '4s In • 6s Out Pattern',
    emoji: '🌬️',
    color: '#06B6D4',
    bg: '#CFFAFE',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Breathe Out', duration: 6 },
    ],
  },
  {
    id: 'clear',
    name: 'Clear Mind',
    pattern: '5-5',
    description: 'Coherent 5s Breathing',
    emoji: '✨',
    color: '#22C55E',
    bg: '#DCFCE7',
    phases: [
      { label: 'Breathe In', duration: 5 },
      { label: 'Breathe Out', duration: 5 },
    ],
  },
];

// ─── Pulse dot for active state ──────────────────────────────────────────────

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

// ─── Exercise Card ───────────────────────────────────────────────────────────

function ExerciseCard({ ex, isActive, isRunning, onPress, theme }: { 
  ex: BreathExercise; 
  isActive: boolean; 
  isRunning: boolean;
  onPress: () => void; 
  theme: any 
}) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (isActive && isRunning) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0);
    }
  }, [isActive, isRunning]);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, isActive && { borderColor: ex.color, borderWidth: 2 }, aStyle]}>
        <View style={[sc.playBtn, isActive ? { backgroundColor: ex.color } : { backgroundColor: theme.colors.surfaceTertiary }]}>
          {isActive && isRunning
            ? <PulseDot color="#fff" />
            : <MaterialCommunityIcons name={isActive ? "play" : "plus"} size={12} color={isActive ? "#fff" : theme.colors.textTertiary} />
          }
        </View>
        <Animated.View style={[sc.iconWrap, bounceStyle]}>
          <Text style={sc.emoji}>{ex.emoji}</Text>
        </Animated.View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{ex.name}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{ex.pattern} • {ex.id.toUpperCase()}</Text>
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

export default function BreathingScreen() {
  const { theme } = useTheme();
  
  const [selectedExercise, setSelectedExercise] = useState<BreathExercise>(EXERCISES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const breathProgress = useSharedValue(0); 
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = selectedExercise.phases[phaseIndex];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animatePhase = useCallback((phase: BreathPhase) => {
    let toValue = 0;
    if (phase.label === 'Breathe In') toValue = 1;
    else if (phase.label === 'Breathe Out') toValue = 0;
    else if (phase.label === 'Hold' && breathProgress.value > 0.5) toValue = 1;
    else toValue = 0;

    breathProgress.value = withTiming(toValue, {
      duration: phase.duration * 1000,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
  }, []);

  const startExercise = useCallback(() => {
    mediumImpact();
    setIsRunning(true);
    setPhaseIndex(0);
    setPhaseTime(0);
    setRoundCount(0);
    setSessionSeconds(0);

    const firstPhase = selectedExercise.phases[0];
    animatePhase(firstPhase);

    let currentPhaseIdx = 0;
    let currentTick = 0;
    let rounds = 0;
    let totalSec = 0;

    intervalRef.current = setInterval(() => {
      currentTick += 1;
      totalSec += 1;
      setSessionSeconds(totalSec);

      const phases = selectedExercise.phases;
      const phaseDur = phases[currentPhaseIdx].duration;

      if (currentTick >= phaseDur) {
        currentPhaseIdx += 1;
        if (currentPhaseIdx >= phases.length) {
          currentPhaseIdx = 0;
          rounds += 1;
          setRoundCount(rounds);
          lightImpact();
        }
        currentTick = 0;
        setPhaseIndex(currentPhaseIdx);
        animatePhase(phases[currentPhaseIdx]);
      }
      setPhaseTime(currentTick);
    }, 1000);
  }, [selectedExercise, animatePhase]);

  const pauseExercise = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetExercise = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPhaseIndex(0);
    setPhaseTime(0);
    setRoundCount(0);
    setSessionSeconds(0);
    breathProgress.value = withTiming(0);
  }, []);

  const selectExercise = (ex: BreathExercise) => {
    if (isRunning) return;
    selectionFeedback();
    setSelectedExercise(ex);
    resetExercise();
  };

  const formatDuration = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const animatedCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathProgress.value, [0, 1], [0.8, 1.2]);
    const opacity = interpolate(breathProgress.value, [0, 1], [0.6, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const activeColor = selectedExercise.color;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / BREATH"
        title="Breathing"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {isRunning && (
            <Pressable onPress={resetExercise} style={styles.featuredStopBtn}>
              <Text style={styles.featuredStopText}>RESET</Text>
              <MaterialCommunityIcons name="refresh" size={16} color="#FF5252" />
            </Pressable>
          )}
          
          <View style={styles.animContainer}>
             <Animated.View style={[styles.outerCircle, { borderColor: activeColor + '40' }, animatedCircleStyle]}>
                <View style={[styles.innerCircle, { backgroundColor: activeColor }]}>
                  <Text style={styles.phaseLabel}>{isRunning ? currentPhase.label.toUpperCase() : 'READY'}</Text>
                  {isRunning && <Text style={styles.phaseTimer}>{currentPhase.duration - phaseTime}s</Text>}
                </View>
             </Animated.View>
          </View>

          <Pressable
            onPress={isRunning ? pauseExercise : startExercise}
            style={styles.featuredPlay}
          >
            <MaterialCommunityIcons name={isRunning ? 'pause' : 'play'} size={18} color={theme.colors.accent} />
            <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>{isRunning ? 'Pause Session' : 'Start Session'}</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.grid}>
          {EXERCISES.map(ex => (
            <ExerciseCard 
              key={ex.id} 
              ex={ex} 
              isActive={selectedExercise.id === ex.id} 
              isRunning={isRunning}
              onPress={() => selectExercise(ex)} 
              theme={theme} 
            />
          ))}
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Session Stats</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{roundCount}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>ROUNDS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatDuration(sessionSeconds)}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>TOTAL TIME</Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>TECHNIQUE INFO</Text>
            <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>{selectedExercise.description}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, padding: 20, marginBottom: 20, minHeight: 180, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredStopText: { color: '#FF5252', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  animContainer: { height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  outerCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, padding: 8, justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: '100%', height: '100%', borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  phaseLabel: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  phaseTimer: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -2 },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, gap: 8 },
  featuredPlayText: { fontSize: 14, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  statDivider: { width: 1, height: 30, opacity: 0.1 },
  settingLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  infoBox: { padding: 15, borderRadius: 16 },
  infoText: { fontSize: 13, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
});
