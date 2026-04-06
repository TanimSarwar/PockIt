import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

// ─── Exercise Definitions ───────────────────────────────────────────────────

interface BreathPhase {
  label: string;
  duration: number; // seconds
}

interface BreathExercise {
  id: string;
  name: string;
  description: string;
  phases: BreathPhase[];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const EXERCISES: BreathExercise[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: '4-4-4-4 pattern used by Navy SEALs',
    icon: 'square-outline',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Breathe Out', duration: 4 },
      { label: 'Hold', duration: 4 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Technique',
    description: 'Relaxing breath for sleep and anxiety',
    icon: 'moon-waning-crescent',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Breathe Out', duration: 8 },
    ],
  },
  {
    id: 'deep',
    name: 'Deep Breathing',
    description: 'Simple 4-6 pattern for beginners',
    icon: 'weather-windy',
    phases: [
      { label: 'Breathe In', duration: 4 },
      { label: 'Breathe Out', duration: 6 },
    ],
  },
];

// ─── Colors ─────────────────────────────────────────────────────────────────

const CALM_COLORS = {
  inhale: '#60A5FA',
  hold: '#34D399',
  exhale: '#A78BFA',
  holdAfter: '#FBBF24',
};

function getPhaseColor(label: string): string {
  if (label === 'Breathe In') return CALM_COLORS.inhale;
  if (label === 'Hold') return CALM_COLORS.hold;
  if (label === 'Breathe Out') return CALM_COLORS.exhale;
  return CALM_COLORS.holdAfter;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BreathingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [selectedExercise, setSelectedExercise] = useState<BreathExercise>(EXERCISES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const circleScale = useRef(new Animated.Value(0.6)).current;
  const circleOpacity = useRef(new Animated.Value(0.4)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentPhase = selectedExercise.phases[phaseIndex];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      animRef.current?.stop();
    };
  }, []);

  const animateCircle = useCallback((phase: BreathPhase) => {
    animRef.current?.stop();

    let toScale = 0.6;
    let toOpacity = 0.4;

    if (phase.label === 'Breathe In') {
      toScale = 1.1;
      toOpacity = 0.9;
    } else if (phase.label === 'Hold') {
      toScale = 1.1;
      toOpacity = 0.7;
    } else if (phase.label === 'Breathe Out') {
      toScale = 0.6;
      toOpacity = 0.4;
    }

    const anim = Animated.parallel([
      Animated.timing(circleScale, {
        toValue: toScale,
        duration: phase.duration * 1000,
        easing: phase.label === 'Hold' ? Easing.linear : Easing.bezier(0.42, 0, 0.58, 1),
        useNativeDriver: true,
      }),
      Animated.timing(circleOpacity, {
        toValue: toOpacity,
        duration: phase.duration * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    animRef.current = anim;
    anim.start();
  }, [circleScale, circleOpacity]);

  const startExercise = useCallback(() => {
    mediumImpact();
    setIsRunning(true);
    setPhaseIndex(0);
    setPhaseTime(0);
    setRoundCount(0);
    setSessionSeconds(0);

    const firstPhase = selectedExercise.phases[0];
    animateCircle(firstPhase);

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
        animateCircle(phases[currentPhaseIdx]);
      }
      setPhaseTime(currentTick);
    }, 1000);
  }, [selectedExercise, animateCircle]);

  const pauseExercise = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    animRef.current?.stop();
  }, []);

  const resetExercise = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    animRef.current?.stop();
    setPhaseIndex(0);
    setPhaseTime(0);
    setRoundCount(0);
    setSessionSeconds(0);
    circleScale.setValue(0.6);
    circleOpacity.setValue(0.4);
  }, [circleScale, circleOpacity]);

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

  const phaseColor = currentPhase ? getPhaseColor(currentPhase.label) : theme.colors.accent;

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <View style={s.pageHead}>
        <View style={s.titleRow}>
          <Pressable 
            onPress={() => router.replace('/(tabs)/wellness')} 
            style={[s.backBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.accent} />
          </Pressable>
          <Text style={[s.pageTitle, { color: theme.colors.text }]}>Breathing Exercise</Text>
        </View>
        <Text style={[s.pageSub, { color: theme.colors.textSecondary }]}>Find your center with guided techniques.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Technique Selector */}
        <View style={s.techniqueList}>
          {EXERCISES.map((ex) => {
            const isSelected = ex.id === selectedExercise.id;
            return (
              <Pressable
                key={ex.id}
                onPress={() => selectExercise(ex)}
                style={[
                  s.techCard,
                  { backgroundColor: theme.colors.surface },
                  isSelected && { borderColor: theme.colors.accent, borderWidth: 2 }
                ]}
              >
                <View style={[s.techIconWrap, { backgroundColor: isSelected ? theme.colors.accent : theme.colors.surfaceTertiary }]}>
                  <MaterialCommunityIcons name={ex.icon} size={20} color={isSelected ? '#FFF' : theme.colors.textTertiary} />
                </View>
                <Text style={[s.techName, { color: isSelected ? theme.colors.accent : theme.colors.text }]}>{ex.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Breathing Animation Area */}
        <View style={s.animWrap}>
          <View style={[s.glowCircle, { backgroundColor: phaseColor, opacity: 0.15 }]} />
          
          <Animated.View
            style={[
              s.outerCircle,
              {
                borderColor: phaseColor + '60',
                transform: [{ scale: circleScale }],
                opacity: circleOpacity,
              },
            ]}
          >
            <View style={[s.innerCircle, { backgroundColor: phaseColor }]}>
              <Text style={s.phaseTxt}>
                {isRunning || sessionSeconds > 0 ? currentPhase.label : 'Ready'}
              </Text>
              {isRunning && (
                <Text style={s.phaseTimer}>{currentPhase.duration - phaseTime}</Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Description & Stats */}
        <View style={[s.statsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[s.descTxt, { color: theme.colors.textSecondary }]}>{selectedExercise.description}</Text>
          
          <View style={s.divider} />

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: theme.colors.text }]}>{roundCount}</Text>
              <Text style={[s.statKey, { color: theme.colors.textTertiary }]}>Rounds</Text>
            </View>
            <View style={[s.vDivider, { backgroundColor: theme.colors.border }]} />
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: theme.colors.text }]}>{formatDuration(sessionSeconds)}</Text>
              <Text style={[s.statKey, { color: theme.colors.textTertiary }]}>Duration</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <Pressable 
            onPress={resetExercise} 
            style={[s.subBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
          >
            <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.text} />
          </Pressable>

          <Pressable 
            onPress={isRunning ? pauseExercise : startExercise} 
            style={[s.playBtn, { backgroundColor: theme.colors.accent }]}
          >
            <MaterialCommunityIcons name={isRunning ? 'pause' : 'play'} size={38} color="#FFF" />
          </Pressable>

          <View style={{ width: 48 }} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingBottom: 100 },
  pageHead:  { paddingHorizontal: 20, paddingTop: 10, marginBottom: 24 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  pageSub:   { fontSize: 14, fontWeight: '500', marginLeft: 48 },

  techniqueList: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  techCard: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  techIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  techName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  animWrap: { height: 320, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowCircle: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  outerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  phaseTxt: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  phaseTimer: { color: '#FFF', fontSize: 48, fontWeight: '900', marginTop: -5 },

  statsCard: { borderRadius: 24, padding: 20, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  descTxt: { textAlign: 'center', fontSize: 14, fontWeight: '500', marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '900' },
  statKey: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  vDivider: { width: 1, height: 30 },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30 },
  subBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
});
