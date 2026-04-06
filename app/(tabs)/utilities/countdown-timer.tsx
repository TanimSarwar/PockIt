import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Button, Card, Input, Modal } from '../../../components/ui';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

interface Timer {
  id: string;
  name: string;
  totalMs: number;
  remainingMs: number;
  running: boolean;
}

function formatTimer(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

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

  const addTimer = () => {
    const mins = parseInt(minutes) || 5;
    const t: Timer = { id: Date.now().toString(), name: name || `Timer ${timers.length + 1}`, totalMs: mins * 60000, remainingMs: mins * 60000, running: false };
    setTimers((prev) => [...prev, t]);
    setShowModal(false);
    setName('');
    setMinutes('5');
  };

  const toggleTimer = (id: string) => {
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
          const remaining = tt.remainingMs - 100;
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
  };

  const resetTimer = (id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) clearInterval(interval);
    intervalsRef.current.delete(id);
    setTimers((prev) => prev.map((t) => t.id === id ? { ...t, remainingMs: t.totalMs, running: false } : t));
  };

  const deleteTimer = (id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) clearInterval(interval);
    intervalsRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Countdown Timers"
        rightAction={
          <Pressable onPress={() => setShowModal(true)} accessibilityLabel="Add timer">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {timers.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="timer-sand-empty" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No timers yet. Tap + to add one.</Text>
          </View>
        )}
        {timers.map((t) => {
          const progress = t.totalMs > 0 ? t.remainingMs / t.totalMs : 0;
          return (
            <Card key={t.id} style={{ marginBottom: 12 }}>
              <View style={styles.timerHeader}>
                <Text style={[styles.timerName, { color: theme.colors.text }]}>{t.name}</Text>
                <Pressable onPress={() => deleteTimer(t.id)} accessibilityLabel="Delete timer">
                  <MaterialCommunityIcons name="close" size={20} color={theme.colors.textTertiary} />
                </Pressable>
              </View>
              <Text style={[styles.timerDisplay, { color: t.remainingMs === 0 ? theme.colors.success : theme.colors.text }]}>
                {t.remainingMs === 0 ? 'Done!' : formatTimer(t.remainingMs)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.accent }]} />
              </View>
              <View style={styles.timerActions}>
                <Button title={t.running ? 'Pause' : 'Start'} size="sm" onPress={() => toggleTimer(t.id)} style={{ flex: 1 }} />
                <Button title="Reset" size="sm" variant="secondary" onPress={() => resetTimer(t.id)} style={{ flex: 1 }} />
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New Timer">
        <Input label="Name" value={name} onChangeText={setName} placeholder="My Timer" />
        <Input label="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" placeholder="5" style={{ marginTop: 8 }} />
        <Button title="Add Timer" onPress={addTimer} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerName: { fontSize: 14, fontWeight: '500' },
  timerDisplay: { fontSize: 36, fontWeight: '300', textAlign: 'center', marginVertical: 8, fontVariant: ['tabular-nums'] },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
  timerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
