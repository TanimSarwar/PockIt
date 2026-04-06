import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Button, Card } from '../../../components/ui';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

type Phase = 'work' | 'break' | 'longBreak';

const DEFAULTS = { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };
const PHASE_LABELS: Record<Phase, string> = { work: 'Focus', break: 'Short Break', longBreak: 'Long Break' };

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

  const start = useCallback(() => {
    lightImpact();
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          notificationSuccess();
          setRunning(false);
          // Auto-advance
          setPhase((p) => {
            if (p === 'work') {
              setSessions((s) => s + 1);
              setTodaySessions((s) => s + 1);
              const nextSessions = sessions + 1;
              if (nextSessions % 4 === 0) {
                setRemaining(DEFAULTS.longBreak);
                return 'longBreak';
              }
              setRemaining(DEFAULTS.break);
              return 'break';
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

  const pause = () => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const skip = () => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (phase === 'work') {
      setPhase('break');
      setRemaining(DEFAULTS.break);
    } else {
      setPhase('work');
      setRemaining(DEFAULTS.work);
    }
  };

  const reset = () => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(DEFAULTS[phase]);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const total = DEFAULTS[phase];
  const progress = total > 0 ? (total - remaining) / total : 0;

  const phaseColor = phase === 'work' ? theme.colors.accent : theme.colors.success;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Pomodoro Timer" />
      <View style={styles.center}>
        {/* Circular progress */}
        <View style={styles.circle}>
          <View style={[styles.circleTrack, { borderColor: theme.colors.border }]} />
          <View style={[styles.circleProgress, { borderColor: phaseColor, borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: `${progress * 360}deg` }] }]} />
          <View style={styles.circleInner}>
            <Text style={[styles.phaseLabel, { color: phaseColor }]}>{PHASE_LABELS[phase]}</Text>
            <Text style={[styles.time, { color: theme.colors.text }]}>
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </Text>
            <Text style={{ color: theme.colors.textTertiary, fontSize: 13 }}>Session {sessions % 4 + 1} of 4</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!running ? (
            <Button title={remaining < total ? 'Resume' : 'Start'} onPress={start} style={{ minWidth: 120 }} />
          ) : (
            <Button title="Pause" variant="secondary" onPress={pause} style={{ minWidth: 120 }} />
          )}
          <Button title="Skip" variant="outline" onPress={skip} size="sm" />
          <Button title="Reset" variant="ghost" onPress={reset} size="sm" />
        </View>

        <Card style={{ marginTop: 32, width: '100%' }}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{todaySessions}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{(todaySessions * 25)}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Focus mins</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  circle: { width: 220, height: 220, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circleTrack: { position: 'absolute', width: '100%', height: '100%', borderRadius: 110, borderWidth: 6 },
  circleProgress: { position: 'absolute', width: '100%', height: '100%', borderRadius: 110, borderWidth: 6 },
  circleInner: { alignItems: 'center' },
  phaseLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  time: { fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
});
