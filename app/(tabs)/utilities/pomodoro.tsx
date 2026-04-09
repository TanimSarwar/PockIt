import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
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
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

type Phase = 'work' | 'break' | 'longBreak';

const DEFAULTS = { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };
const PHASE_LABELS: Record<Phase, string> = { work: 'Focus', break: 'Short Break', longBreak: 'Long Break' };
const PHASE_ICONS: Record<Phase, any> = { work: 'brain', break: 'coffee', longBreak: 'rest' };
const PHASE_TAGS: Record<Phase, string> = { work: 'Deep Concentration', break: 'Quick Refresher', longBreak: 'Extended Restoration' };

// ─── Pulse dot for active state ──────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
    return () => cancelAnimation(o);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, s]} />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, theme }: { label: string; value: string | number; icon: any; color: string; theme: any }) {
  return (
    <View style={[sc.card, { backgroundColor: theme.colors.surface }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={sc.info}>
        <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{value}</Text>
        <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card:      { width: CARD_W, borderRadius: 20, padding: 14, gap: 12, elevation: 2 },
  iconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info:      { gap: 2 },
  name:      { fontSize: 18, fontWeight: '800' },
  tags:      { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<Phase>('work');
  const [remaining, setRemaining] = useState(DEFAULTS.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const switchPhase = useCallback((newPhase: Phase) => {
    selectionFeedback();
    stopTimer();
    setPhase(newPhase);
    setRemaining(DEFAULTS[newPhase]);
  }, [stopTimer]);

  const start = useCallback(() => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          notificationSuccess();
          setRunning(false);
          // Auto-advance logic
          setPhase((p) => {
            if (p === 'work') {
              setSessions((s) => s + 1);
              setTodaySessions((s) => s + 1);
              const nextSessions = sessions + 1;
              const nextP = nextSessions % 4 === 0 ? 'longBreak' : 'break';
              setRemaining(DEFAULTS[nextP as Phase]);
              return nextP as Phase;
            }
            setRemaining(DEFAULTS.work);
            return 'work';
          });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    setRunning(true);
  }, [sessions]);

  const reset = useCallback(() => {
    lightImpact();
    stopTimer();
    setRemaining(DEFAULTS[phase]);
  }, [phase, stopTimer]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / FOCUS"
        title="Pomodoro"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {running && (
            <View style={styles.cardBadge}>
               <PulseDot color="#fff" />
               <Text style={[styles.badgeText, { color: '#fff' }]}>LIVE</Text>
            </View>
          )}
          <Text style={styles.featuredLabel}>{PHASE_LABELS[phase].toUpperCase()} SESSION</Text>
          <Text style={styles.featuredTitle}>{formatTime}</Text>
          <View style={styles.featuredControls}>
            <Pressable onPress={running ? stopTimer : start} style={styles.featuredPlay}>
               <MaterialCommunityIcons name={running ? 'pause' : 'play'} size={24} color={theme.colors.accent} />
               <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>{running ? 'Pause' : 'Start Focus'}</Text>
            </Pressable>
            <Pressable onPress={reset} style={styles.featuredIconBtn}>
               <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>SWITCH MODE</Text>
        <View style={styles.phaseRow}>
           {(['work', 'break', 'longBreak'] as Phase[]).map((p) => (
             <Pressable 
               key={p} 
               onPress={() => switchPhase(p)} 
               style={[styles.phasePill, { backgroundColor: phase === p ? theme.colors.accent : theme.colors.surfaceSecondary }]}
             >
               <Text style={[styles.phasePillText, { color: phase === p ? '#fff' : theme.colors.textSecondary }]}>{PHASE_LABELS[p]}</Text>
             </Pressable>
           ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary, marginTop: 28 }]}>PERFORMANCE</Text>
        <View style={styles.grid}>
          <StatCard 
            label="Total Sessions" 
            value={todaySessions} 
            icon="check-circle" 
            color="#22C55E" 
            theme={theme} 
          />
          <StatCard 
            label="Focus Minutes" 
            value={todaySessions * 25} 
            icon="clock-fast" 
            color="#3B82F6" 
            theme={theme} 
          />
          <StatCard 
            label="Streak" 
            value="3 Days" 
            icon="fire" 
            color="#F59E0B" 
            theme={theme} 
          />
          <StatCard 
            label="Efficiency" 
            value="94%" 
            icon="bolt" 
            color="#8B5CF6" 
            theme={theme} 
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceTertiary }]}>
           <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} />
           <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
             You've completed {sessions % 4} of 4 sessions before your next long break.
           </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  cardBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  featuredCard: { borderRadius: 24, padding: 18, marginBottom: 20, minHeight: 115, justifyContent: 'center', alignItems: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  featuredTitle: { color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: -1.5, marginVertical: 2 },
  featuredControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, gap: 6 },
  featuredPlayText: { fontSize: 14, fontWeight: '800' },
  featuredIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '800', marginBottom: 10, letterSpacing: 1.2 },
  phaseRow: { flexDirection: 'row', gap: 8 },
  phasePill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  phasePillText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: { marginTop: 28, padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
