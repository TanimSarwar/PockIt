import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
import { Button, Input, Modal } from '../../../components/ui';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

interface Timer {
  id: string;
  name: string;
  totalMs: number;
  remainingMs: number;
  running: boolean;
}

const PRESETS = [
  { label: '1m',  mins: 1 },
  { label: '5m',  mins: 5 },
  { label: '10m', mins: 10 },
  { label: '30m', mins: 30 },
];

function formatTimer(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

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

function TimerCard({ 
  timer: t, 
  onToggle, 
  onReset, 
  onDelete, 
  theme 
}: { 
  timer: Timer; 
  onToggle: () => void; 
  onReset: () => void; 
  onDelete: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);
  const pressIn  = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const progress = t.totalMs > 0 ? t.remainingMs / t.totalMs : 0;
  const isDone = t.remainingMs <= 0;

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onLongPress={onDelete}>
      <Animated.View style={[tc.card, { backgroundColor: theme.colors.surface }, t.running && { borderColor: theme.colors.accent, borderWidth: 2 }, aStyle]}>
        <View style={tc.header}>
           <Pressable onPress={onReset} hitSlop={10} style={tc.btnPos}>
             <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.textTertiary} />
           </Pressable>
           
           <Pressable onPress={onDelete} hitSlop={10} style={tc.btnPos}>
             <MaterialCommunityIcons name="close" size={16} color={theme.colors.textTertiary} />
           </Pressable>
        </View>

        <View style={tc.info}>
          <Text style={[tc.name, { color: theme.colors.text }]} numberOfLines={1}>{t.name}</Text>
          <Text style={[tc.time, { color: isDone ? theme.colors.success : theme.colors.text, fontWeight: '700' }]}>
            {isDone ? 'DONE' : formatTimer(t.remainingMs)}
          </Text>
        </View>

        <View style={tc.footer}>
          <View style={[tc.progressTrack, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <View style={[tc.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.accent }]} />
          </View>
          <Pressable 
            onPress={onToggle}
            style={[tc.playBtn, t.running ? { backgroundColor: theme.colors.accent } : { backgroundColor: theme.colors.surfaceTertiary }]}
          >
            {t.running ? (
              <PulseDot color="#fff" />
            ) : (
              <MaterialCommunityIcons name="play" size={14} color={theme.colors.textTertiary} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const tc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 24, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 3, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: -4 },
  btnPos: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  info: { gap: 1, alignItems: 'center' },
  name: { fontSize: 12, fontWeight: '600', opacity: 0.6, textAlign: 'center' },
  time: { fontSize: 18, letterSpacing: -0.5, textAlign: 'center' },
  footer: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 3, borderRadius: 1.5, overflow: 'hidden' },
  progressFill: { height: '100%' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default function CountdownTimerScreen() {
  const { theme } = useTheme();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('5');
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    return () => { intervalsRef.current.forEach((id) => clearInterval(id)); };
  }, []);

  const addTimer = (customMins?: number, customName?: string) => {
    const mins = customMins || parseInt(minutes) || 5;
    const t: Timer = { 
      id: Date.now().toString(), 
      name: customName || name || `Timer ${timers.length + 1}`, 
      totalMs: mins * 60000, 
      remainingMs: mins * 60000, 
      running: false 
    };
    setTimers((prev) => [...prev, t]);
    setShowModal(false);
    setName('');
    setMinutes('5');
    lightImpact();
  };

  const toggleTimer = useCallback((id: string) => {
    lightImpact();
    setTimers((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      if (t.running) {
        const interval = intervalsRef.current.get(id);
        if (interval) clearInterval(interval);
        intervalsRef.current.delete(id);
        return { ...t, running: false };
      }
      const interval = setInterval(() => {
        setTimers((ts) => ts.map((tt) => {
          if (tt.id !== id) return tt;
          const remaining = Math.max(0, tt.remainingMs - 100);
          if (remaining <= 0) {
            const iv = intervalsRef.current.get(id);
            if (iv) clearInterval(iv);
            intervalsRef.current.delete(id);
            notificationSuccess();
            Alert.alert('Timer Done', `"${tt.name}" has finished!`);
            return { ...tt, remainingMs: 0, running: false };
          }
          return { ...tt, remainingMs: remaining };
        }));
      }, 100);
      intervalsRef.current.set(id, interval);
      return { ...t, running: true };
    }));
  }, []);

  const resetTimer = useCallback((id: string) => {
    lightImpact();
    const interval = intervalsRef.current.get(id);
    if (interval) clearInterval(interval);
    intervalsRef.current.delete(id);
    setTimers((prev) => prev.map((t) => t.id === id ? { ...t, remainingMs: t.totalMs, running: false } : t));
  }, []);

  const deleteTimer = useCallback((id: string) => {
    selectionFeedback();
    const interval = intervalsRef.current.get(id);
    if (interval) clearInterval(interval);
    intervalsRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const runningTimers = timers.filter(t => t.running);
  const activeTimer = runningTimers.length > 0 
    ? [...runningTimers].sort((a, b) => a.remainingMs - b.remainingMs)[0]
    : (timers.length > 0 ? timers[0] : null);

  const featuredLabel = runningTimers.length > 1 
    ? `${runningTimers.length} TIMERS RUNNING`
    : (activeTimer?.running ? 'RUNNING NOW' : 'NEXT TIMER');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TIME" 
         title="Countdown" 
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Pressable onPress={() => setShowModal(true)} style={styles.featuredAdd}>
             <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>

          <Text style={styles.featuredLabel}>{featuredLabel}</Text>
          <Text style={styles.featuredTitle}>{activeTimer ? activeTimer.name : 'No Active Timers'}</Text>
          {activeTimer && (
            <Pressable onPress={() => toggleTimer(activeTimer.id)} style={styles.featuredPlay}>
               <MaterialCommunityIcons name={activeTimer.running ? 'pause' : 'play'} size={24} color={theme.colors.accent} />
               <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>
                 {activeTimer.running ? formatTimer(activeTimer.remainingMs) : 'Start'}
               </Text>
            </Pressable>
          )}
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>ALL TIMERS</Text>
        
        {timers.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="timer-sand-empty" size={32} color={theme.colors.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Stay focused. Add a timer to start.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {timers.map((t) => (
              <TimerCard 
                key={t.id} 
                timer={t} 
                theme={theme} 
                onToggle={() => toggleTimer(t.id)}
                onReset={() => resetTimer(t.id)}
                onDelete={() => deleteTimer(t.id)}
              />
            ))}
          </View>
        )}

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
           <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Quick Presets</Text>
           <View style={styles.presetsRow}>
             {PRESETS.map(p => (
               <Pressable 
                 key={p.label} 
                 onPress={() => addTimer(p.mins, `${p.label} Timer`)}
                 style={[styles.presetPill, { backgroundColor: theme.colors.surfaceSecondary }]}
               >
                 <Text style={[styles.presetPillText, { color: theme.colors.textSecondary }]}>{p.label}</Text>
               </Pressable>
             ))}
           </View>
        </View>
      </ScrollView>

      {/* Centered Modal Implementation */}
      <RNModal 
        visible={showModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />
            
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalFields}>
                <Input 
                  label="Timer Name" 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="e.g. Work Focus" 
                  inputStyle={styles.textCenter}
                  containerStyle={styles.fieldItem}
                  autoFocus
                />
                <Input 
                  label="Minutes" 
                  value={minutes} 
                  onChangeText={setMinutes} 
                  keyboardType="number-pad" 
                  placeholder="5" 
                  inputStyle={styles.textCenter}
                  containerStyle={styles.fieldItem}
                />
              </View>
              
              <Button title="Create Timer" onPress={() => addTimer()} style={{ marginTop: 28, width: '100%' }} />
              
              <Pressable onPress={() => setShowModal(false)} style={styles.modalCancel}>
                <Text style={[styles.modalCancelText, { color: theme.colors.textTertiary }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  featuredCard: { borderRadius: 24, padding: 20, marginBottom: 28, minHeight: 130, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  featuredAdd: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -1, marginBottom: 12, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, gap: 6 },
  featuredPlayText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  presetsRow: { flexDirection: 'row', gap: 8 },
  presetPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  presetPillText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500', opacity: 0.6 },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    padding: 20,
    paddingTop: Platform.OS === 'web' ? '15%' : '20%'
  },
  modalContent: { width: '100%', borderRadius: 32, padding: 28, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
  modalFields: { width: '100%', gap: 16 },
  fieldItem: { width: '100%', alignItems: 'center' },
  textCenter: { textAlign: 'center' },
  modalCancel: { marginTop: 16, padding: 8 },
  modalCancelText: { fontSize: 13, fontWeight: '600' },
});
