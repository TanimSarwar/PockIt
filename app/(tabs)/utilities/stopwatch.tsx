import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Button, Card } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export default function StopwatchScreen() {
  const { theme } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    lightImpact();
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 10);
    setRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }, []);

  const lap = useCallback(() => {
    lightImpact();
    setLaps((prev) => [elapsed, ...prev]);
  }, [elapsed]);

  const bestLap = laps.length > 1 ? Math.min(...laps.map((l, i) => i === 0 ? l - (laps[1] ?? 0) : l - (laps[i + 1] ?? 0)).filter(v => v > 0)) : 0;
  const worstLap = laps.length > 1 ? Math.max(...laps.map((l, i) => i === 0 ? l - (laps[1] ?? 0) : l - (laps[i + 1] ?? 0)).filter(v => v > 0)) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Stopwatch" />
      <View style={styles.timerArea}>
        <Text style={[styles.time, { color: theme.colors.text }]}>{formatTime(elapsed)}</Text>
      </View>

      <View style={styles.controls}>
        {!running ? (
          <>
            <Button title={elapsed > 0 ? 'Resume' : 'Start'} onPress={start} style={{ flex: 1 }} />
            {elapsed > 0 && <Button title="Reset" variant="secondary" onPress={reset} style={{ flex: 1 }} />}
          </>
        ) : (
          <>
            <Button title="Lap" variant="secondary" onPress={lap} style={{ flex: 1 }} />
            <Button title="Stop" variant="outline" onPress={stop} style={{ flex: 1 }} />
          </>
        )}
      </View>

      {laps.length > 0 && (
        <FlatList
          data={laps}
          keyExtractor={(_, i) => i.toString()}
          style={styles.lapList}
          renderItem={({ item, index }) => {
            const split = index < laps.length - 1 ? item - laps[index + 1] : item;
            return (
              <View style={[styles.lapRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.textSecondary }}>Lap {laps.length - index}</Text>
                <Text style={[styles.lapTime, { color: theme.colors.text }]}>{formatTime(split)}</Text>
                <Text style={{ color: theme.colors.textTertiary }}>{formatTime(item)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  timerArea: { alignItems: 'center', paddingVertical: 40 },
  time: { fontSize: 56, fontWeight: '200', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  lapList: { marginTop: 20, paddingHorizontal: 16 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  lapTime: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
