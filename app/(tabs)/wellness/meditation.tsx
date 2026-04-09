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
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;
const STORAGE_KEY = 'pockit-meditation-sessions';

// ─── Constants ──────────────────────────────────────────────────────────────

interface Option {
  id: string;
  label: string;
  tags: string;
  emoji: string;
  color: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const DURATION_OPTIONS: Option[] = [
  { id: '5', label: 'Quick Zen', tags: '5 Minutes • Light', emoji: '🧘', color: '#10B981' },
  { id: '10', label: 'Daily Mind', tags: '10 Minutes • Mid', emoji: '✨', color: '#3B82F6' },
  { id: '15', label: 'Deep Focus', tags: '15 Minutes • Hard', emoji: '🌊', icon: 'waves', color: '#8B5CF6' },
  { id: '20', label: 'Inner Peace', tags: '20 Minutes • Long', emoji: '🌸', color: '#EC4899' },
  { id: '30', label: 'Nirvana', tags: '30 Minutes • Pro', emoji: '🕯️', color: '#F59E0B' },
  { id: '45', label: 'Eternity', tags: '45 Minutes • Max', emoji: '🪐', color: '#6366F1' },
];

const AMBIENT_SOUNDS: Option[] = [
  { id: 'none', label: 'Silent', tags: 'No Audio', emoji: '🔇', color: '#6B7280' },
  { id: 'rain', label: 'Rainfall', tags: 'Nature • Soft', emoji: '💧', color: '#3B82F6' },
  { id: 'ocean', label: 'Waves', tags: 'Nature • Deep', emoji: '🌊', color: '#06B6D4' },
  { id: 'forest', label: 'Woods', tags: 'Nature • Calm', emoji: '🌲', color: '#22C55E' },
  { id: 'bells', label: 'Chimes', tags: 'Ting • Echo', emoji: '🔔', color: '#A855F7' },
  { id: 'white', label: 'Energy', tags: 'System • Static', emoji: '⚙️', color: '#9CA3AF' },
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

// ─── Option Card ─────────────────────────────────────────────────────────────

function OptionCard({ item, isActive, onPress, theme }: { item: Option; isActive: boolean; onPress: () => void; theme: any }) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
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
  }, [isActive]);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, isActive && { borderColor: item.color, borderWidth: 2 }, aStyle]}>
        <View style={[sc.playBtn, isActive ? { backgroundColor: item.color } : { backgroundColor: theme.colors.surfaceTertiary }]}>
          {isActive
            ? <PulseDot color="#fff" />
            : <MaterialCommunityIcons name="check" size={12} color={theme.colors.textTertiary} />
          }
        </View>
        <Animated.View style={[sc.iconWrap, bounceStyle]}>
          <Text style={sc.emoji}>{item.emoji}</Text>
        </Animated.View>
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

export default function MeditationScreen() {
  const { theme } = useTheme();
  const [duration, setDuration] = useState(10); // minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isComplete, setIsComplete] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [ambientSound, setAmbientSound] = useState('none');

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setTotalSessions(parseInt(val, 10) || 0);
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const totalSeconds = duration * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);

  const startPulse = useCallback(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
      ),
      -1,
      false
    );
  }, [pulse]);

  const stopPulse = useCallback(() => {
    pulse.value = withTiming(1);
  }, [pulse]);

  const startSession = useCallback(() => {
    mediumImpact();
    setIsRunning(true);
    setIsPaused(false);
    setElapsed(0);
    setIsComplete(false);
    startPulse();

    let sec = 0;
    progress.value = 0;
    intervalRef.current = setInterval(() => {
      sec += 1;
      setElapsed(sec);
      progress.value = withTiming(sec / (duration * 60), { duration: 1000, easing: Easing.linear });

      if (sec >= duration * 60) {
        finishSession();
      }
    }, 1000);
  }, [duration, startPulse, progress]);

  const finishSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsComplete(true);
    notificationSuccess();
    stopPulse();

    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      const count = (parseInt(val || '0', 10) || 0) + 1;
      AsyncStorage.setItem(STORAGE_KEY, count.toString());
      setTotalSessions(count);
    });
  }, [stopPulse]);

  const pauseSession = useCallback(() => {
    lightImpact();
    setIsPaused(true);
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    stopPulse();
  }, [stopPulse]);

  const resumeSession = useCallback(() => {
    lightImpact();
    setIsPaused(false);
    setIsRunning(true);
    startPulse();

    let sec = elapsed;
    intervalRef.current = setInterval(() => {
      sec += 1;
      setElapsed(sec);
      progress.value = withTiming(sec / (duration * 60), { duration: 1000, easing: Easing.linear });

      if (sec >= duration * 60) {
        finishSession();
      }
    }, 1000);
  }, [elapsed, duration, startPulse, finishSession, progress]);

  const stopSession = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    setIsPaused(false);
    setElapsed(0);
    setIsComplete(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopPulse();
    progress.value = 0;
  }, [stopPulse, progress]);

  const formatTime = (totalSec: number): string => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.08], [0.8, 1]),
  }));

  const progressWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (isComplete) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader category="WELLNESS / RELAX" title="Session Complete" />
        <View style={styles.completeContainer}>
          <View style={[styles.completeIcon, { backgroundColor: theme.colors.successBg }]}>
            <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={[styles.completeTitle, { color: theme.colors.text }]}>Zen Achieved</Text>
          <Text style={[styles.completeSubtitle, { color: theme.colors.textSecondary }]}>You meditated for {duration} minutes</Text>

          <View style={styles.completeStats}>
            <View style={[styles.completeStat, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.completeStatValue, { color: theme.colors.accent }]}>{duration}</Text>
              <Text style={[styles.completeStatLabel, { color: theme.colors.textSecondary }]}>Minutes</Text>
            </View>
            <View style={[styles.completeStat, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.completeStatValue, { color: theme.colors.accent }]}>{totalSessions}</Text>
              <Text style={[styles.completeStatLabel, { color: theme.colors.textSecondary }]}>Sessions</Text>
            </View>
          </View>

          <Pressable onPress={stopSession} style={[styles.doneButton, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.doneButtonText}>Finish Session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const showTimer = isRunning || isPaused;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / RELAX"
        title="Meditation"
        rightAction={
          <View style={styles.badge}>
            <MaterialCommunityIcons name="meditation" size={14} color={theme.colors.accent} />
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>{totalSessions}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} scrollEnabled={!showTimer}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {showTimer ? (
            <>
              <Pressable onPress={stopSession} style={styles.featuredStopBtn}>
                <Text style={styles.featuredStopText}>CANCEL</Text>
                <MaterialCommunityIcons name="close-circle" size={16} color="#FF5252" />
              </Pressable>
              
              <Animated.View style={[styles.featuredTimerWrap, ringStyle]}>
                <Text style={styles.featuredTimerText}>{formatTime(remaining)}</Text>
                <Text style={styles.featuredTimerSub}>{isRunning ? 'DEEP BREATH' : 'PAUSED'}</Text>
              </Animated.View>

              <View style={[styles.featuredProgressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Animated.View style={[styles.featuredProgressFill, progressWidth]} />
              </View>

              <Pressable onPress={isRunning ? pauseSession : resumeSession} style={styles.featuredPlay}>
                <MaterialCommunityIcons name={isRunning ? 'pause' : 'play'} size={18} color={theme.colors.accent} />
                <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>{isRunning ? 'Pause' : 'Resume'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.featuredLabel}>READY TO START?</Text>
              <Text style={styles.featuredTitle}>{duration} Minute Session</Text>
              <Pressable onPress={startSession} style={styles.featuredPlay}>
                <MaterialCommunityIcons name="play" size={18} color={theme.colors.accent} />
                <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>Start Meditation</Text>
              </Pressable>
            </>
          )}
        </LinearGradient>

        {!showTimer && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>CHOOSE DURATION</Text>
            <View style={styles.grid}>
              {DURATION_OPTIONS.map(opt => (
                <OptionCard 
                  key={opt.id} 
                  item={opt} 
                  isActive={duration === parseInt(opt.id, 10)} 
                  onPress={() => { selectionFeedback(); setDuration(parseInt(opt.id, 10)); }} 
                  theme={theme} 
                />
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary, marginTop: 12 }]}>AMBIENT SOUND</Text>
            <View style={styles.grid}>
              {AMBIENT_SOUNDS.map(snd => (
                <OptionCard 
                  key={snd.id} 
                  item={snd} 
                  isActive={ambientSound === snd.id} 
                  onPress={() => { selectionFeedback(); setAmbientSound(snd.id); }} 
                  theme={theme} 
                />
              ))}
            </View>

            <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginTop: 12 }]}>
              <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Mindfulness Stats</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.accent + '20' }]}>
                   <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={[styles.statTitle, { color: theme.colors.text }]}>{totalSessions} Sessions Completed</Text>
                  <Text style={[styles.statSub, { color: theme.colors.textSecondary }]}>Keep up the great work!</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  featuredCard: { borderRadius: 24, padding: 20, marginBottom: 24, minHeight: 180, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  featuredStopText: { color: '#FF5252', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8, elevation: 4 },
  featuredPlayText: { fontSize: 14, fontWeight: '800' },
  featuredTimerWrap: { alignItems: 'center', marginBottom: 16 },
  featuredTimerText: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  featuredTimerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: -4 },
  featuredProgressBar: { width: '80%', height: 6, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  featuredProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 15, fontWeight: '700' },
  statSub: { fontSize: 12, fontWeight: '500' },
  completeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  completeIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24, elevation: 4 },
  completeTitle: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  completeSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  completeStats: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  completeStat: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2 },
  completeStatValue: { fontSize: 28, fontWeight: '900' },
  completeStatLabel: { fontSize: 12, marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },
  doneButton: { paddingVertical: 18, paddingHorizontal: 48, borderRadius: 20, width: '100%', elevation: 4 },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
});
